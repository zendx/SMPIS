import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../server/db.js";
import { initializeSchema, applicationSchema } from "../server/schema.js";
import { createDocumentStorage } from "../server/document-storage.js";
import { supabaseConfiguration, prepareDocumentBucket } from "../server/supabase.js";
import { DOCUMENT_MAX_BYTES } from "../server/document-limits.js";
import { postgresConfiguration } from "../server/postgres-config.js";

const env = {
  DATABASE_URL: "postgresql://postgres.project:example@aws-0.example.pooler.supabase.com:6543/postgres?sslmode=require",
  SUPABASE_URL: "https://project.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-server-key",
  SUPABASE_STORAGE_BUCKET: "school-documents",
};
const config = supabaseConfiguration(env);
function storageEnvironment(t, overrides = env) {
  const keys = ["VERCEL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_STORAGE_BUCKET"];
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) {
    if (overrides[key] === undefined) delete process.env[key];
    else process.env[key] = overrides[key];
  }
  t.after(() => {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });
}

test("Supabase deployment configuration requires complete secrets, HTTPS and SSL", () => {
  assert.equal(config.url, "https://project.supabase.co");
  for (const key of Object.keys(env)) {
    const incomplete = { ...env };
    delete incomplete[key];
    assert.throws(() => supabaseConfiguration(incomplete), new RegExp(key));
  }
  assert.throws(() => supabaseConfiguration({ ...env, SUPABASE_URL: "http://project.supabase.co" }), /HTTPS/);
  assert.throws(() => supabaseConfiguration({ ...env, DATABASE_URL: env.DATABASE_URL.replace("sslmode=require", "sslmode=disable") }), /sslmode/);
});

test("serverless PostgreSQL uses a bounded pool and preserves trusted CA verification", () => {
  assert.equal(postgresConfiguration(env.DATABASE_URL, { VERCEL: "1" }).max, 1);
  assert.throws(() => postgresConfiguration(env.DATABASE_URL, { DB_POOL_MAX: "0" }), /DB_POOL_MAX/);
  const connection = postgresConfiguration(env.DATABASE_URL, { VERCEL: "1", DB_SSL_CA: "test\\ncertificate" });
  assert.equal(new URL(connection.connectionString).searchParams.has("sslmode"), false);
  assert.deepEqual(connection.ssl, { ca: "test\ncertificate", rejectUnauthorized: true });
  assert.equal(connection.connectionTimeoutMillis, 10_000);
});

test("Supabase setup creates a private bucket with supported MIME types and the Vercel upload limit", async () => {
  const requests = [];
  await prepareDocumentBucket(config, {
    create: true, fetchImpl: async (url, options) => {
      requests.push({ url, ...options });
      return new Response(requests.length === 1 ? "[]" : "{}", { status: 200 });
    },
  });
  assert.equal(requests.length, 2);
  assert.equal(requests[1].method, "POST");
  assert.equal(requests[1].headers.apikey, env.SUPABASE_SERVICE_ROLE_KEY);
  assert.deepEqual(JSON.parse(requests[1].body), {
    id: config.bucket, name: config.bucket, public: false,
    file_size_limit: DOCUMENT_MAX_BYTES,
    allowed_mime_types: ["application/pdf", "image/png", "image/jpeg"],
  });
});

test("Supabase setup refuses public or incorrectly restricted buckets and check never creates one", async () => {
  const bucket = { id: config.bucket, public: false, file_size_limit: DOCUMENT_MAX_BYTES,
    allowed_mime_types: ["application/pdf", "image/png", "image/jpeg"] };
  const fetchBucket = (value) => async () => new Response(JSON.stringify(value));
  await prepareDocumentBucket(config, { fetchImpl: fetchBucket([bucket]) });
  await assert.rejects(prepareDocumentBucket(config, { create: true, fetchImpl: fetchBucket([{ ...bucket, public: true }]) }), /public/);
  await assert.rejects(prepareDocumentBucket(config, { fetchImpl: fetchBucket([{ ...bucket, allowed_mime_types: ["*/*"] }]) }), /4194304/);
  await assert.rejects(prepareDocumentBucket(config, { fetchImpl: fetchBucket([]) }), /missing/);
  await assert.rejects(prepareDocumentBucket(config, { fetchImpl: async () => new Response("denied", { status: 401 }) }), /401/);
});

test("Supabase private storage preserves upload MIME, bytes, authentication and deletion", async (t) => {
  storageEnvironment(t);
  const requests = [], bytes = Buffer.from("%PDF-1.4\nprivate document");
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requests.push({ url, ...options });
    return new Response(options.method === "GET" ? bytes : "{}");
  });
  const storage = createDocumentStorage();
  await storage.put("private-document", bytes, "application/pdf");
  assert.ok((await storage.get("private-document")).equals(bytes));
  await storage.delete("private-document");
  assert.equal(requests[0].headers["Content-Type"], "application/pdf");
  assert.equal(requests[0].headers.Authorization, `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`);
  assert.equal(requests[0].body, bytes);
  assert.equal(requests[1].url, `${env.SUPABASE_URL}/storage/v1/object/school-documents/private-document`);
  assert.deepEqual(JSON.parse(requests[2].body), { prefixes: ["private-document"] });
});

test("Supabase storage errors surface without falling back to local files", async (t) => {
  storageEnvironment(t);
  t.mock.method(globalThis, "fetch", async () => new Response("denied", { status: 403 }));
  const storage = createDocumentStorage();
  await assert.rejects(storage.put("denied", Buffer.from("%PDF-"), "application/pdf"), /403/);
  await assert.rejects(storage.get("denied"), /403/);
  await assert.rejects(storage.delete("denied"), /403/);
});

test("Vercel refuses local persistence and partial Supabase configuration", async (t) => {
  storageEnvironment(t, { VERCEL: "1" });
  await assert.rejects(openDatabase({ url: undefined }), /DATABASE_URL/);
  assert.throws(() => createDocumentStorage(), /Configure SUPABASE/);
  process.env.SUPABASE_URL = env.SUPABASE_URL;
  assert.throws(() => createDocumentStorage(), /incomplete/);
});

test("Supabase schema protection blocks public API roles while preserving server SQL access", async () => {
  const db = await openDatabase({ memory: true });
  try {
    await db.exec("CREATE ROLE anon; CREATE ROLE authenticated;");
    const { tables } = await applicationSchema();
    // Model the broad grants that some Supabase projects give newly created tables.
    await db.exec("GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC, anon, authenticated;");
    await initializeSchema(db, { protectPublicTables: true });
    const secured = (await db.query("SELECT relname,relrowsecurity FROM pg_class WHERE relname=ANY($1::text[])", [tables])).rows;
    assert.equal(secured.length, tables.length);
    assert.ok(secured.every((table) => table.relrowsecurity));
    // Running setup again keeps tables and their records intact.
    await db.query("INSERT INTO schools(name,short_code) VALUES('Hosted School','HOST')");
    await initializeSchema(db, { protectPublicTables: true });
    assert.equal((await db.query("SELECT count(*)::int AS n FROM schools")).rows[0].n, 1);
    for (const role of ["anon", "authenticated"]) {
      const grants = (await db.query(
        "SELECT table_name FROM unnest($2::text[]) AS t(table_name) WHERE has_table_privilege($1, 'public.' || quote_ident(table_name), 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')", [role, tables],
      )).rows;
      assert.deepEqual(grants, []);
      await db.exec(`SET ROLE ${role}`);
      try {
        for (const table of tables) {
          await assert.rejects(db.query(`SELECT * FROM public."${table}" LIMIT 1`), (error) => error.code === "42501");
        }
        await assert.rejects(db.query("INSERT INTO schools(name,short_code) VALUES('Unauthorized','DENY')"), (error) => error.code === "42501");
      } finally { await db.exec("RESET ROLE"); }
    }
    assert.equal((await db.query("SELECT name FROM schools")).rows[0].name, "Hosted School");
  } finally { await db.close(); }
});

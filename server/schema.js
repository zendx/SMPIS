import { readFile } from "node:fs/promises";

export async function applicationSchema() {
  const files = ["schema.sql", "academic-schema.sql", "operations-schema.sql", "refinement-schema.sql", "integration-schema.sql"];
  const sql = (await Promise.all(files.map((file) =>
    readFile(new URL(file, import.meta.url), "utf8")))).join("\n");
  const tables = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS ([a-z_]+)/g)].map((m) => m[1]);
  return { sql, tables };
}

export async function initializeSchema(db, { protectPublicTables = false } = {}) {
  const { sql, tables } = await applicationSchema();
  await db.exec(sql);
  if (!protectPublicTables) return;
  // Browser Supabase keys must never bypass the application's session/role checks.
  const roles = (await db.query("SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated')")).rows;
  for (const table of tables) {
    await db.query(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY`);
    await db.query(`REVOKE ALL ON TABLE public."${table}" FROM PUBLIC`);
    for (const { rolname } of roles)
      await db.query(`REVOKE ALL ON TABLE public."${table}" FROM "${rolname}"`);
  }
}

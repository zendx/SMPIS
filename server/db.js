import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
// Keep calendar dates independent of the server machine's timezone.
pg.types.setTypeParser(1082, (value) => value);

export async function openDatabase({
  memory = false,
  dataDir = process.env.DATA_DIR || "./data",
  url = process.env.DATABASE_URL,
} = {}) {
  let db;
  if (url && !memory) {
    const pool = new pg.Pool({ connectionString: url });
    const wrap = (client) => ({
      query: (sql, args = []) => client.query(sql, args),
    });
    db = {
      ...wrap(pool),
      exec: (sql) => pool.query(sql),
      close: () => pool.end(),
      transaction: async (fn) => {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const result = await fn(wrap(client));
          await client.query("COMMIT");
          return result;
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        } finally {
          client.release();
        }
      },
    };
  } else {
    if (!memory) await mkdir(dataDir, { recursive: true });
    db = new PGlite(memory ? "memory://" : path.resolve(dataDir, "postgres"), {
      parsers: { 1082: (value) => value },
    });
  }
  await db.exec(
    await readFile(new URL("./schema.sql", import.meta.url), "utf8"),
  );
  await db.exec(
    await readFile(new URL("./academic-schema.sql", import.meta.url), "utf8"),
  );
  await db.exec(await readFile(new URL("./operations-schema.sql", import.meta.url), "utf8"));
  return db;
}
export async function rows(db, sql, args = []) {
  return (await db.query(sql, args)).rows;
}
export async function one(db, sql, args = []) {
  return (await rows(db, sql, args))[0];
}
export async function insert(db, table, values) {
  const keys = Object.keys(values);
  return one(
    db,
    `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`,
    Object.values(values),
  );
}
export async function audit(
  db,
  user,
  entity,
  id,
  action,
  before = null,
  after = null,
) {
  await insert(db, "audit_logs", {
    school_id: user.school_id,
    user_id: user.id,
    entity_type: entity,
    entity_id: id,
    action,
    previous_value: before ? JSON.stringify(before) : null,
    new_value: after ? JSON.stringify(after) : null,
  });
}

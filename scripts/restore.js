import { PGlite } from "@electric-sql/pglite";
import { readFile, mkdir, readdir, cp } from "node:fs/promises";
import path from "node:path";
const [backup, target] = process.argv.slice(2);
if (!backup || !target)
  throw new Error(
    "Usage: node scripts/restore.js <backup-directory> <new-empty-data-directory>",
  );
const source = path.resolve(backup),
  destination = path.resolve(target);
try {
  if ((await readdir(destination)).length)
    throw new Error(
      "Restore target must be empty. Existing data is never overwritten.",
    );
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const manifest = JSON.parse(
  await readFile(path.join(source, "manifest.json"), "utf8"),
);
if (manifest.engine !== "pglite")
  throw new Error(
    "Restore PostgreSQL server dumps with pg_restore; see README.md.",
  );
await mkdir(destination, { recursive: true });
const db = new PGlite({
  dataDir: path.join(destination, "postgres"),
  loadDataDir: new Blob([await readFile(path.join(source, "database.tar.gz"))]),
});
await db.waitReady;
await db.close();
try {
  await cp(
    path.join(source, "documents"),
    path.join(destination, "documents"),
    { recursive: true },
  );
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
console.log(
  `Legacy backup restored to ${destination}. SMPIS requires Supabase; migrate recovered records separately before using them.`,
);

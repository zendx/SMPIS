import path from "node:path";
import { fileURLToPath } from "node:url";
import { openDatabase } from "./server/db.js";
import { createApp } from "./server/app.js";

if (!process.env.DATABASE_URL)
  throw new Error("DATABASE_URL is required for the Vercel deployment.");
if (
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY ||
  !process.env.SUPABASE_STORAGE_BUCKET
)
  throw new Error(
    "Configure Supabase URL, service role key and private storage bucket before deploying.",
  );

process.env.TRUST_PROXY_HOPS ||= "1";
const db = await openDatabase({
  url: process.env.DATABASE_URL,
  dataDir: "/tmp/smpis",
});
const app = await createApp(db, { dataDir: "/tmp/smpis", production: true });
const indexPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "public", "index.html");
app.get("/{*path}", (req, res) => res.sendFile(indexPath));

export default app;

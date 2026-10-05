import path from "node:path";
import { fileURLToPath } from "node:url";
import { openDatabase } from "./server/db.js";
import { createApp } from "./server/app.js";
import { supabaseConfiguration } from "./server/supabase.js";

supabaseConfiguration();

process.env.TRUST_PROXY_HOPS ||= "1";
const db = await openDatabase({
  url: process.env.DATABASE_URL,
  dataDir: "/tmp/smpis",
  initialize: false,
});
const app = await createApp(db, { dataDir: "/tmp/smpis", production: true });
const indexPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "public", "index.html");
app.get("/{*path}", (req, res) => res.sendFile(indexPath));

export default app;

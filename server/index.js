import "dotenv/config";
import express from "express";
import path from "node:path";
import { openDatabase } from "./db.js";
import { createApp } from "./app.js";
import { runJobs } from "./jobs.js";
import { acquireDataLock, backupDatabase } from "./backup.js";
import { existsSync } from "node:fs";
import { writeFile, readFile } from "node:fs/promises";
const production = process.argv.includes("--production"),
  dataDir = process.env.DATA_DIR || "./data";
const release = await acquireDataLock(dataDir);
const db = await openDatabase({ dataDir }),
  app = await createApp(db, { dataDir, production });
if (production) {
  app.use(express.static("dist"));
  app.get("/{*path}", (req, res) =>
    res.sendFile(path.resolve("dist/index.html")),
  );
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
const host = process.env.HOST || "127.0.0.1",
  port = Number(process.env.PORT || 3000);
const server = app.listen(port, host, () =>
  console.log(`SMPIS is ready at http://${host}:${port}`),
);
let running = false;
const jobs = async () => {
  if (running) return;
  running = true;
  try {
    await runJobs(db);
    const marker = path.resolve(dataDir, "last-backup.txt");
    const last = existsSync(marker)
      ? Number(await readFile(marker, "utf8"))
      : 0;
    if (Date.now() - last > 24 * 60 * 60 * 1000) {
      await backupDatabase(db, { dataDir });
      await writeFile(marker, String(Date.now()));
    }
  } catch (error) {
    console.error("Background job failed:", error.message);
  } finally {
    running = false;
  }
};
const timer = setInterval(jobs, 60_000);
timer.unref();
jobs();
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    clearInterval(timer);
    server.close(async () => {
      await db.close();
      await release();
      process.exit(0);
    });
  });

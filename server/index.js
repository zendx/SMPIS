import "dotenv/config";
import express from "express";
import path from "node:path";
import { openDatabase } from "./db.js";
import { createApp } from "./app.js";
import { runJobs } from "./jobs.js";
const production = process.argv.includes("--production");
const db = await openDatabase(),
  app = await createApp(db, { production });
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
      process.exit(0);
    });
  });

import path from "node:path";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";

export function createDocumentStorage({ dataDir = "./data" } = {}) {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, ""),
    serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket = process.env.SUPABASE_STORAGE_BUCKET || "school-documents",
    remote = Boolean(baseUrl && serviceKey);

  if (process.env.VERCEL && !remote)
    throw new Error(
      "Configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and a private storage bucket before deploying to Vercel.",
    );

  async function request(method, key, body) {
    const response = await fetch(
      `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeURIComponent(key)}`,
      {
        method,
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          ...(body ? { "Content-Type": "application/octet-stream" } : {}),
        },
        body,
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok)
      throw new Error(`Private document storage returned ${response.status}.`);
    return response;
  }

  return {
    async put(key, buffer) {
      if (remote) {
        await request("POST", key, buffer);
        return;
      }
      const dir = path.resolve(dataDir, "documents");
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, key), buffer, { flag: "wx" });
    },
    async get(key) {
      if (remote) return Buffer.from(await (await request("GET", key)).arrayBuffer());
      return readFile(path.resolve(dataDir, "documents", key));
    },
    async delete(key) {
      if (remote) {
        const response = await fetch(
          `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}`,
          {
            method: "DELETE",
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ prefixes: [key] }),
            signal: AbortSignal.timeout(15_000),
          },
        );
        if (!response.ok)
          throw new Error(
            `Private document storage returned ${response.status}.`,
          );
        return;
      }
      await unlink(path.resolve(dataDir, "documents", key));
    },
  };
}

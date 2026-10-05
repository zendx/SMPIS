import path from "node:path";

// Vercel ignores express.static(); explicit file routes also cover requests
// that reach the function instead of the static asset layer.
export function serveFrontend(app, directory) {
  app.get("/assets/{*asset}", (req, res) => {
    const asset = req.params.asset.join("/");
    res.sendFile(asset, {
      root: path.join(directory, "assets"),
      dotfiles: "deny",
      immutable: true,
      maxAge: "1y",
    }, error => {
      if (!error || res.headersSent) return;
      res.status(error.status === 403 ? 403 : 404).type("text/plain").send("Asset not found.");
    });
  });
  app.get("/assets", (req, res) => res.sendStatus(404));
  app.get("/{*route}", (req, res) => {
    res.set("Cache-Control", "no-cache");
    res.sendFile(path.join(directory, "index.html"));
  });
}

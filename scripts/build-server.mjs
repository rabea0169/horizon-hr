import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

await esbuild.build({
  entryPoints: [path.join(root, "api/boot.ts")],
  outfile: path.join(root, "dist/boot.js"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  packages: "external",
  alias: {
    "@": path.join(root, "src"),
    "@contracts": path.join(root, "contracts"),
    "@db": path.join(root, "db"),
    db: path.join(root, "db"),
  },
});

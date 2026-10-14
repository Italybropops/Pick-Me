import { readFile, stat } from "node:fs/promises";
import { MAX_BYTES, parseImport } from "../src/core/data";
import { recommend } from "../src/core/engine";
const path = process.argv[2];
try {
  if (!path)
    throw new Error(
      "Usage: npm run recommend -- /path/to/workspace.json [ISO-clock]",
    );
  if ((await stat(path)).size > MAX_BYTES)
    throw new Error("File size exceeds the 2 MB limit.");
  const data = parseImport(await readFile(path, "utf8"));
  if (data.kind !== "pick-me-workspace")
    throw new Error("Expected a complete pick-me-workspace backup.");
  const decision = recommend(
    data.task,
    data.providers,
    data.inventory,
    data.hardware,
    process.argv[3],
  );
  process.stdout.write(JSON.stringify(decision, null, 2) + "\n");
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Recommendation failed",
  );
  process.exitCode = 1;
}

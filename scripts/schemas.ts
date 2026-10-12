import { mkdir, writeFile } from "node:fs/promises";
import { z } from "zod";
import {
  TaskSchema,
  ProviderSchema,
  EvidenceSchema,
  AccessSchema,
  HardwareSchema,
  DecisionSchema,
  StageSchema,
  WorkspaceSchema,
  RegistrySchema,
} from "../src/core/schema";
await mkdir("schemas", { recursive: true });
for (const [name, schema] of Object.entries({
  task: TaskSchema,
  provider: ProviderSchema,
  evidence: EvidenceSchema,
  inventory: AccessSchema,
  hardware: HardwareSchema,
  decision: DecisionSchema,
  stage: StageSchema,
  workspace: WorkspaceSchema,
  registry: RegistrySchema,
})) {
  await writeFile(
    `schemas/${name}.v1.json`,
    JSON.stringify(
      {
        ...z.toJSONSchema(schema),
        $id: `https://github.com/Italybropops/Pick-Me/schemas/${name}.v1.json`,
        title: `Pick-Me ${name} v1`,
      },
      null,
      2,
    ) + "\n",
  );
}
console.log(
  "Generated nine version-1 schemas in schemas/. Runtime validation also enforces safe URLs, unique IDs, and references.",
);

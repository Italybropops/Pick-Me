import { test, expect } from "@playwright/test";
import { provider, access, task, workspace, NOW } from "../fixtures";
import type { Workspace } from "../../src/core/schema";
async function importWorkspace(
  page: import("@playwright/test").Page,
  w: Workspace,
) {
  await page
    .getByRole("button", { name: "Backup & discovery", exact: true })
    .click();
  await page.getByLabel("Import JSON file").setInputFiles({
    name: "synthetic-workspace.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(w)),
  });
  await expect(
    page.getByRole("heading", { name: "Review import" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Apply import" }).click();
  await page.getByRole("button", { name: "Find a route", exact: true }).click();
}
test("real import replacement renders comparison cards and a bounded workflow", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date(NOW));
  await page.goto("/");
  const w = workspace();
  w.providers = [
    provider("synthetic-a"),
    provider("synthetic-b"),
    provider("synthetic-image", { capabilities: ["image"] }),
  ];
  w.inventory = w.providers.map((p) => access(p.id));
  w.scratchpad = "Imported synthetic draft";
  await importWorkspace(page, w);
  await expect(
    page.getByRole("heading", { name: "A close call. You choose." }),
  ).toBeVisible();
  await expect(page.locator(".compare-card")).toHaveCount(2);
  await expect(page.getByLabel("Your local draft")).toHaveValue(
    "Imported synthetic draft",
  );
  await page
    .getByLabel("What would you like to do?")
    .fill("Write a brief and create an image");
  await page.getByRole("button", { name: "Interpret words" }).click();
  await page
    .getByRole("button", { name: "Find my route", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A bounded toolchain" }),
  ).toBeVisible();
  await expect(page.locator(".stages > li")).toHaveCount(2);
  await expect(
    page.locator(".workflow").getByText("Ready now", { exact: true }),
  ).toHaveCount(3);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "A bounded toolchain" }),
  ).toBeVisible();
});
test("imported markup is inert and unsafe source URLs are rejected before replacement", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date(NOW));
  await page.goto("/");
  const w = workspace();
  w.providers[0].name = '<img src=x onerror="window.injected=true">';
  await importWorkspace(page, w);
  await expect(
    page
      .getByTestId("ready-routes")
      .getByRole("heading", { name: w.providers[0].name }),
  ).toBeVisible();
  expect(await page.evaluate(() => "injected" in window)).toBe(false);
  expect(await page.locator("img").count()).toBe(0);
  w.providers[0].evidence[0].url = "javascript:alert(1)";
  await page
    .getByRole("button", { name: "Backup & discovery", exact: true })
    .click();
  await page.getByLabel("Import JSON file").setInputFiles({
    name: "unsafe.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(w)),
  });
  await expect(page.getByRole("alert")).toContainText("public HTTPS URL");
  await expect(
    page.getByRole("heading", { name: "Review import" }),
  ).toHaveCount(0);
});
test("failed refresh preserves dates; successful retrieval never verifies an unchecked claim", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Evidence library", exact: true })
    .click();
  const card = page.locator(".evidence-provider").filter({
    has: page.getByRole("heading", { name: "ChatGPT", exact: true }),
  });
  const stored = () =>
    page.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem("pick-me.workspace.v1")!,
        ).providers.find((p: { id: string }) => p.id === "chatgpt").evidence[0],
    );
  const before = await stored();
  await page.route("https://help.openai.com/**", (route) =>
    route.abort("failed"),
  );
  await card.getByRole("button", { name: "Refresh source" }).click();
  await expect(card).toContainText("Refresh failed");
  expect((await stored()).verifiedAt).toEqual(before.verifiedAt);
  expect((await stored()).fetchedAt).toEqual(before.fetchedAt);
  await page.unroute("https://help.openai.com/**");
  await page.route("https://help.openai.com/**", (route) =>
    route.fulfill({
      status: 200,
      body: "Synthetic official-page retrieval for this browser test.",
      headers: { "access-control-allow-origin": "*" },
    }),
  );
  await card.getByRole("button", { name: "Refresh source" }).click();
  await expect.poll(async () => (await stored()).fetchedAt).not.toBeNull();
  expect((await stored()).verifiedAt).toBeNull();
  await card.getByRole("button", { name: "Review claim" }).click();
  await page.getByLabel("Evidence status").selectOption("verified");
  await page
    .getByLabel(
      "I reviewed this specific claim and scope against the source now",
    )
    .check();
  await page.getByRole("button", { name: "Save evidence review" }).click();
  await expect.poll(async () => (await stored()).verifiedAt).not.toBeNull();
});
test("no background external requests, keyboard dialogs, and clipboard fallback", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!new URL(r.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/))
      external.push(r.url());
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Permission denied");
        },
      },
    }),
  );
  await page.goto("/");
  await page
    .getByTestId("ready-routes")
    .getByRole("button", { name: "Copy execution prompt" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Text to copy")).toContainText(
    "$0 additional spending",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Tool inventory", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit Codex CLI" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Access state")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Edit Codex CLI" }),
  ).toBeFocused();
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
test("no eligible zero-dollar video route is clearly explained", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date(NOW));
  await page.goto("/");
  const w = workspace();
  w.providers = [provider("synthetic-video", { capabilities: ["video"] })];
  w.inventory = [
    access("synthetic-video", { status: "paid", incrementalCost: 9 }),
  ];
  w.task = task({ capabilities: ["video"], text: "Create a synthetic video" });
  await importWorkspace(page, w);
  await expect(
    page.getByText("No eligible $0 route.", { exact: false }),
  ).toBeVisible();
  await page.locator(".exclusions summary").click();
  await expect(page.locator(".exclusions")).toContainText(
    "Additional spending exceeds the $0 budget",
  );
});

import { test, expect, type Page } from "@playwright/test";
import { provider, access, workspace, NOW } from "../fixtures";

async function syntheticWorkspace(page: Page) {
  await page.clock.setFixedTime(new Date(NOW));
  await page.goto("/");
  const w = workspace();
  w.providers = [provider("audited-tool")];
  w.inventory = [access("audited-tool")];
  await page
    .getByRole("button", { name: "Backup & discovery", exact: true })
    .click();
  await page.getByLabel("Import JSON file").setInputFiles({
    name: "synthetic-audit.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(w)),
  });
  await page.getByRole("button", { name: "Apply import" }).click();
  await page
    .getByRole("button", { name: "Evidence library", exact: true })
    .click();
}
async function stored(page: Page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("pick-me.workspace.v1")!),
  );
}

test("mobile navigation reaches every screen and native dialogs retain keyboard focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const [navigation, heading] of [
    ["Tool inventory", "Tools on your terms."],
    ["Evidence library", "Know what you know."],
    ["Backup & discovery", "Keep your options open."],
    ["Find a route", "A clearer next step."],
  ]) {
    await page.getByRole("button", { name: navigation, exact: true }).click();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  }
  await page
    .getByRole("button", { name: "Tool inventory", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit Local text workspace" }).click();
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Edit Local text workspace" }),
  ).toBeFocused();
});

test("a late source refresh preserves drafts edited after navigation", async ({
  page,
}) => {
  await syntheticWorkspace(page);
  await page.clock.setFixedTime(new Date("2026-10-12T12:01:00.000Z"));
  let release!: () => void, started!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const requested = new Promise<void>((resolve) => (started = resolve));
  await page.route("https://example.com/**", async (route) => {
    started();
    await gate;
    await route.fulfill({
      status: 200,
      body: "Synthetic source response",
      headers: { "access-control-allow-origin": "*" },
    });
  });
  await page.getByRole("button", { name: "Refresh source" }).click();
  await requested;
  await page.getByRole("button", { name: "Find a route", exact: true }).click();
  await page
    .getByLabel("Your local draft")
    .fill("Synthetic draft saved while the source request was pending.");
  release();
  await expect
    .poll(async () => (await stored(page)).providers[0].evidence[0].fetchedAt)
    .not.toBe(NOW);
  await expect(page.getByLabel("Your local draft")).toHaveValue(
    "Synthetic draft saved while the source request was pending.",
  );
});

test("advanced provider edits cannot retain verification after changing claim provenance", async ({
  page,
}) => {
  await syntheticWorkspace(page);
  await page.getByRole("button", { name: "Edit provider record" }).click();
  const record = JSON.parse(
    await page.getByLabel("Provider JSON").inputValue(),
  );
  record.evidence[0].sourceType = "benchmark";
  await page.getByLabel("Provider JSON").fill(JSON.stringify(record));
  await page.getByRole("button", { name: "Save provider record" }).click();
  await expect
    .poll(async () => (await stored(page)).providers[0].evidence[0].verifiedAt)
    .toBeNull();
  expect((await stored(page)).providers[0].evidence[0].status).toBe(
    "uncertain",
  );
});

test("changing a source URL clears retrieval metadata for the previous source", async ({
  page,
}) => {
  await syntheticWorkspace(page);
  await page.getByRole("button", { name: "Review claim" }).click();
  await page
    .getByLabel("Source URL")
    .fill("https://example.com/new-synthetic-source");
  await page.getByRole("button", { name: "Save evidence review" }).click();
  await expect
    .poll(async () => (await stored(page)).providers[0].evidence[0].fetchedAt)
    .toBeNull();
  expect((await stored(page)).providers[0].evidence[0].verifiedAt).toBeNull();
});

import { test, expect } from "@playwright/test";
test("complete local route, copy brief, save scratchpad, and reload", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A clearer next step." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Find my route", exact: true })
    .click();
  await expect(
    page
      .getByTestId("ready-routes")
      .getByText("Local text workspace", { exact: true }),
  ).toBeVisible();
  await page
    .getByTestId("ready-routes")
    .getByRole("button", { name: "Copy execution prompt" })
    .click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "$0 additional spending",
  );
  await page
    .getByLabel("Your local draft")
    .fill("Synthetic checklist: review, refine, finish.");
  await page.reload();
  await expect(page.getByLabel("Your local draft")).toHaveValue(
    "Synthetic checklist: review, refine, finish.",
  );
});
test("inventory, evidence, export/import preview, and safe errors", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Tool inventory", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit LibreOffice" }).click();
  await page.getByLabel("Access state").selectOption("free-setup");
  await page.getByLabel("Incremental cost ($)").fill("0");
  await page.getByLabel("Allowance type").selectOption("unlimited");
  await page.getByRole("button", { name: "Record observation now" }).click();
  await page.getByRole("button", { name: "Save inventory entry" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Tool inventory", exact: true })
    .click();
  await expect(page.getByTestId("inventory-libreoffice")).toContainText(
    "Free setup needed",
  );
  await page
    .getByRole("button", { name: "Evidence library", exact: true })
    .click();
  await expect(
    page.getByText("Retrieved ≠ verified", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Backup & discovery", exact: true })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export workspace" }).click();
  const downloaded = await downloadPromise;
  const path = await downloaded.path();
  await page.getByLabel("Import JSON file").setInputFiles(path!);
  await expect(
    page.getByRole("heading", { name: "Review import" }),
  ).toBeVisible();
  await expect(page.getByText("8 providers", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Cancel import" }).click();
  await page.getByText("Or paste JSON", { exact: true }).click();
  await page.getByLabel("Paste JSON").fill('{"schemaVersion":99}');
  await page.getByRole("button", { name: "Preview import" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Unsupported schemaVersion",
  );
});
test("mobile viewport has no horizontal page overflow and private image requirements persist", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByLabel("What would you like to do?")
    .fill("Create a private image offline");
  await page.getByRole("button", { name: "Interpret words" }).click();
  await page
    .getByRole("button", { name: "Find my route", exact: true })
    .click();
  await expect(page.getByTestId("ready-routes")).toContainText(
    "No ready routes",
  );
  await expect(page.getByLabel("Offline only")).toBeChecked();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});

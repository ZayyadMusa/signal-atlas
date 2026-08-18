const { test, expect } = require("@playwright/test");

test("shows the initial location-selection state", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Signal Atlas/);
  await expect(
    page.getByRole("heading", { name: "No location selected" })
  ).toBeVisible();
  await expect(page.locator("#rainfall-chart")).toBeHidden();
  await expect(page.locator("#temperature-chart")).toBeHidden();
  await expect(page.locator("#report-year")).toHaveValue("2025");
});

test("requires a location before loading a report", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "View conditions" }).click();

  await expect(page.locator("#data-status")).toHaveText(
    "Choose a location before viewing its conditions."
  );
  await expect(page.locator("#location")).toBeFocused();
});

test("loads a complete location report", async ({ page }) => {
  await page.goto("/");
  await page.locator("#location").selectOption("lagos");
  await page.getByRole("button", { name: "View conditions" }).click();

  await expect(
    page.getByRole("heading", { name: "Lagos report" })
  ).toBeVisible();
  await expect(page.locator("#data-status")).toContainText(
    "All 365 daily records are present"
  );
  await expect(page.locator("#report-metadata")).toBeVisible();
  await expect(page.locator("#report-period")).toContainText("2025");
  await expect(page.locator("#rainfall-chart")).toBeVisible();
  await expect(page.locator("#rainfall-bars > li")).toHaveCount(12);
  await expect(page.locator("#temperature-chart")).toBeVisible();
  await expect(page.locator("#temperature-points circle")).toHaveCount(12);
  await expect(page.locator("#temperature-table-body tr")).toHaveCount(12);
});

test("loads a leap-year report", async ({ page }) => {
  await page.goto("/");
  await page.locator("#location").selectOption("kaduna");
  await page.locator("#report-year").selectOption("2024");
  await expect(
    page.getByRole("heading", { name: "Kaduna, 2024 selected" })
  ).toBeVisible();
  await page.getByRole("button", { name: "View conditions" }).click();

  await expect(
    page.getByRole("heading", { name: "Kaduna report" })
  ).toBeVisible();
  await expect(page.locator("#data-status")).toContainText(
    "All 366 daily records are present"
  );
  await expect(page.locator("#report-period")).toContainText("2024");
  await expect(page.locator("#report-coverage")).toHaveText(
    "366 of 366 temperature days and 366 of 366 rainfall days"
  );
});

test("shows a useful error when report loading fails", async ({ page }) => {
  await page.route("**/data/abuja-2025.json", (route) => route.abort());
  await page.goto("/");
  await page.locator("#location").selectOption("abuja");
  await page.getByRole("button", { name: "View conditions" }).click();

  await expect(
    page.getByRole("heading", { name: "Abuja report unavailable" })
  ).toBeVisible();
  await expect(page.locator("#data-status")).toContainText(
    "could not load this report"
  );
  await expect(page.locator("#rainfall-chart")).toBeHidden();
  await expect(page.locator("#temperature-chart")).toBeHidden();
});

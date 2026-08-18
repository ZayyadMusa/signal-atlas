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
  await expect(page.locator("#year-comparison")).toBeVisible();
  await expect(page.locator("#year-comparison-description")).toContainText(
    "2025 compared with 2024"
  );
  await expect(page.locator("#rainfall-comparison")).toContainText("mm");
  await expect(page.locator("#temperature-comparison")).toContainText("°C");
  await expect(page).toHaveURL(/\?location=lagos&year=2025$/);
});

test("keeps the main report when the comparison cannot load", async ({ page }) => {
  await page.route("**/data/abuja-2024.json", (route) => route.abort());
  await page.goto("/");
  await page.locator("#location").selectOption("abuja");
  await page.getByRole("button", { name: "View conditions" }).click();

  await expect(page.getByRole("heading", { name: "Abuja report" })).toBeVisible();
  await expect(page.locator("#rainfall-chart")).toBeVisible();
  await expect(page.locator("#year-comparison-description")).toContainText("comparison could not be loaded");
  await expect(page.locator("#rainfall-comparison")).toHaveText("Not available");
});

test("copies the current report link", async ({ page }) => {
  let copiedLink = "";
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (value) => {
          window.copiedReportLink = value;
        },
      },
      configurable: true,
    });
  });
  await page.goto("/?location=lagos&year=2025");
  await page.getByRole("button", { name: "Copy report link" }).click();
  copiedLink = await page.evaluate(() => window.copiedReportLink);

  expect(copiedLink).toMatch(/\?location=lagos&year=2025$/);
  await expect(page.locator("#copy-link-status")).toHaveText(
    "Report link copied."
  );
});

test("explains how to recover when copying fails", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async () => { throw new Error("Denied"); } },
      configurable: true,
    });
  });
  await page.goto("/?location=abuja&year=2024");
  await page.getByRole("button", { name: "Copy report link" }).click();

  await expect(page.locator("#copy-link-status")).toContainText(
    "Copy it from the address bar"
  );
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

test("restores a shared report URL", async ({ page }) => {
  await page.goto("/?location=port-harcourt&year=2024");

  await expect(page.locator("#location")).toHaveValue("port-harcourt");
  await expect(page.locator("#report-year")).toHaveValue("2024");
  await expect(
    page.getByRole("heading", { name: "Port Harcourt report" })
  ).toBeVisible();
  await expect(page.locator("#report-period")).toContainText("2024");
});

test("ignores and removes unsupported report parameters", async ({ page }) => {
  await page.goto("/?location=unknown&year=2035");

  await expect(page.locator("#location")).toHaveValue("");
  await expect(page.locator("#report-year")).toHaveValue("2025");
  await expect(
    page.getByRole("heading", { name: "No location selected" })
  ).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("restores the empty state with browser history", async ({ page }) => {
  await page.goto("/");
  await page.locator("#location").selectOption("abuja");
  await page.getByRole("button", { name: "View conditions" }).click();
  await expect(page).toHaveURL(/\?location=abuja&year=2025$/);

  await page.goBack();

  await expect(page.locator("#location")).toHaveValue("");
  await expect(
    page.getByRole("heading", { name: "No location selected" })
  ).toBeVisible();
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

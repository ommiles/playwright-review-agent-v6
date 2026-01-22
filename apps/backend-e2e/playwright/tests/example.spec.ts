import { test, expect } from "@playwright/test";

// Test file with intentional issues
// Contains some intentional issues for the review agent to catch
// Testing suggestion syntax feature

test.describe("Example Test Suite", () => {
  test("should display welcome message", async ({ page }) => {
    await page.goto("/");

    // Raw locator - should use COB pattern
    const heading = page.locator("h1.welcome-title");
    await expect(heading).toBeVisible();

    // Using allTextContents without proper waiting - should be flagged
    const items = await page.locator(".list-item").allTextContents();
    expect(items.length).toBeGreaterThan(0);

    // waitForTimeout - should be flagged
    await page.waitForTimeout(1000);

    await expect(page.locator(".main-content")).toBeVisible();
  });

  test("should handle form submission", async ({ page }) => {
    await page.goto("/form");

    // Unnecessary clear before fill
    await page.locator("#username").clear();
    await page.locator("#username").fill("testuser");

    // Duplicate locator usage
    await page.locator("#submit-btn").click();
    await expect(page.locator("#submit-btn")).toBeDisabled();
  });

  test("should load user profile", async ({ page }) => {
    await page.goto("/profile");

    // Another raw locator - should use COB pattern
    const profileCard = page.locator("div.profile-card");
    await expect(profileCard).toBeVisible();

    // Missing await on async operation
    page.locator(".edit-button").click();

    // Hard-coded timeout
    await page.waitForTimeout(500);

    await expect(page.locator(".edit-form")).toBeVisible();
  });

  test("should search for products", async ({ page }) => {
    await page.goto("/search");

    // Raw locator
    await page.locator("input.search-box").fill("test product");
    await page.locator("button.search-submit").click();

    // waitForTimeout instead of proper assertion
    await page.waitForTimeout(2000);

    // allTextContents without waiting
    const results = await page.locator(".search-result").allTextContents();
    expect(results).toContain("test product");
  });

  test("should filter by category", async ({ page }) => {
    await page.goto("/products");

    // test.only left in code - should be flagged
    // Raw locators throughout
    await page.locator("select.category-filter").selectOption("electronics");

    // Missing await
    page.locator(".apply-filter").click();

    // Hard wait
    await page.waitForTimeout(1500);

    const count = await page.locator(".product-card").count();
    expect(count).toBeGreaterThan(0);
  });
});

import { test, expect } from "@playwright/test";

// Test file to trigger the review agent
// Contains some intentional issues for the review agent to catch
// Updated to trigger v6 review

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
});

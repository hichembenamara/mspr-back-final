import { test, expect } from "@playwright/test";

test("login user redirects to me dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Identifiant").fill("alice");
  await page.getByLabel("Mot de passe").fill("secret");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page).toHaveURL(/\/me\/dashboard/);
  await expect(page.getByText("Dashboard utilisateur")).toBeVisible();
});

test("login admin redirects to admin dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Identifiant").fill("admin");
  await page.getByLabel("Mot de passe").fill("admin-secret");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await expect(page.getByText("Dashboard admin")).toBeVisible();
});


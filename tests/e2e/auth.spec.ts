import { test, expect } from '@playwright/test';

test.describe('Autenticación y Permisos', () => {
  test('redirección a login cuando no está autenticado', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*login/);
  });

  test('redirección a login desde POS', async ({ page }) => {
    await page.goto('/pos');
    await expect(page).toHaveURL(/.*login/);
  });

  test('acceso a login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Zentory/);
    // Verificar que existe el formulario de login
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

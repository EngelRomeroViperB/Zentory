import { test, expect } from '@playwright/test';

test.describe('POS Flujos', () => {
  test('POS redirige a login si no está autenticado', async ({ page }) => {
    await page.goto('/pos');
    await expect(page).toHaveURL(/.*login/);
  });

  test('POS muestra interfaz cuando está autenticado', async ({ page }) => {
    // Mock de autenticación - en un test real usaríamos login automático
    // o un estado de autenticación pre-configurado
    test.skip(true, 'Requiere setup de autenticación automática');
    
    await page.goto('/pos');
    // Verificar que carga el scanner de productos
    await expect(page.locator('input[placeholder*="Escanear"]')).toBeVisible();
    // Verificar que carga el resumen del carrito
    await expect(page.locator('text=El carrito está vacío')).toBeVisible();
  });

  test('POS permite escanear productos', async ({ page }) => {
    test.skip(true, 'Requiere base de datos de test con productos');
    
    await page.goto('/pos');
    const scanner = page.locator('input[placeholder*="Escanear"]');
    await scanner.fill('123456');
    await scanner.press('Enter');
    
    // Verificar que el producto aparece en el carrito
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
  });
});

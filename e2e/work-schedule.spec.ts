import { expect, test } from '@playwright/test';
import { login } from './helpers';

test('график работы: выделение мышью, статус, очистка', async ({ page }) => {
  await login(page);
  await page.waitForURL((url) => !url.pathname.includes('login'));
  await page.goto('/work_schedule?month=2026-12');
  const cells = page.locator('[data-cell-doc]');
  await cells.first().waitFor();
  const a = await cells.nth(1).boundingBox();
  const b = await cells.nth(31 + 3).boundingBox(); // вторая строка, 4-й день
  if (!a || !b) throw new Error('no cells');
  await page.mouse.move(a.x + 5, a.y + 5);
  await page.mouse.down();
  await page.mouse.move(b.x + 5, b.y + 5, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByText('Выбрано 6 ячеек')).toBeVisible();
  await page.getByRole('button', { name: 'Отпуск', exact: true }).click();
  await expect(page.getByText('Успешно')).toBeVisible();
  await expect(cells.nth(2)).toHaveText('отп');

  await cells.nth(2).click();
  await page.getByRole('button', { name: 'Неполный день', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Часы работы' });
  await dialog.getByRole('button', { name: 'Применить' }).click();
  await expect(cells.nth(2)).toHaveText('10–14');

  await cells.nth(2).click();
  await page.getByRole('button', { name: 'Очистить' }).click();
  await expect(cells.nth(2)).toHaveText('');
});

import { expect, test } from '@playwright/test';
import { login } from './helpers';

test('дашборд собирается из виджетов базы', async ({ page }) => {
  await login(page);
  await page.waitForURL((url) => !url.pathname.includes('login'));
  await page.goto('/dashboard/46');
  await expect(page.getByRole('heading', { level: 1, name: 'Дашборд' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Показатели сегодня' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Топ специалистов (Год)' })).toBeVisible();
  await expect(page.locator('.recharts-surface').first()).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Филиал' })).toBeVisible();
});

test('отдельный график из меню', async ({ page }) => {
  await login(page);
  await page.waitForURL((url) => !url.pathname.includes('login'));
  await page.goto('/chart/136');
  await expect(page.getByRole('heading', { level: 1, name: 'Выручка по специалистам (график)' })).toBeVisible();
  await expect(page.locator('.recharts-surface').first()).toBeVisible();
});

import type { Page } from '@playwright/test';

export async function login(page: Page, password = '123456789') {
  await page.goto('/login');
  await page.getByLabel('Логин').fill('DemoOpatra');
  await page.getByLabel('Пароль').fill(password);
  await page.getByRole('button', { name: 'Войти' }).click();
}

import { expect, test } from '@playwright/test';
import { login } from './helpers';

test('уведомления: всплывающие и список по группам', async ({ page }) => {
  await login(page);
  await page.waitForURL((url) => !url.pathname.includes('login'));
  await expect(page.getByText('Онлайн-запись: Смирнова Анна, 12:00, консультация').first()).toBeVisible();
  await page.getByRole('button', { name: /^Уведомления: 4/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Уведомления' });
  await expect(sheet.getByText('Заканчивается товар: перчатки нитриловые (осталось 2 уп.)')).toBeVisible();
  await sheet.getByRole('button', { name: 'Задачи' }).click();
  await expect(sheet.getByText('Перезвонить клиенту по поводу плана лечения')).toBeVisible();
  await expect(sheet.getByText('Заканчивается товар: перчатки нитриловые (осталось 2 уп.)')).toHaveCount(0);
});

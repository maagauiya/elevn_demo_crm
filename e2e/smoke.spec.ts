import { expect, test } from '@playwright/test';
import { login } from './helpers';

// e2e идут на MSW-моках (vite --mode mocks): меню — снимок реального WAGetNav из демо-базы.

test('логин → стартовый раздел → переход по вложенному меню', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await login(page);

  const nav = page.getByRole('navigation', { name: 'Меню' });
  await expect(nav.getByRole('link', { name: 'Расписание', exact: true })).toBeVisible();

  await nav.getByRole('link', { name: 'Расписание', exact: true }).click();
  await expect(page).toHaveURL(/\/logbook$/);
  await expect(page.getByText(/\d+ специалист/)).toBeVisible();

  // Вложенная папка: Склад › Справочники › Товары → движок таблиц
  const sklad = nav.getByRole('button', { name: 'Склад', exact: true });
  await sklad.click();
  const skladFolder = nav
    .getByRole('listitem')
    .filter({ has: page.getByRole('button', { name: 'Склад', exact: true }) });
  await skladFolder.getByRole('button', { name: 'Справочники', exact: true }).click();
  await skladFolder.getByRole('link', { name: 'Товары', exact: true }).click();
  await expect(page).toHaveURL(/\/info\/\d+$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Товары' })).toBeVisible();
});

test('поиск по разделам', async ({ page }) => {
  await login(page);
  const nav = page.getByRole('navigation', { name: 'Меню' });
  await nav.getByRole('searchbox').fill('зарплата специалистов');
  await expect(nav.getByRole('link', { name: /Зарплата специалистов/ }).first()).toBeVisible();
});

test('неверный пароль показывает ошибку из RESULT строки', async ({ page }) => {
  await login(page, 'wrong');
  await expect(page.getByRole('alert')).toHaveText('Неправильный пароль');
});

test('пустая форма подсвечивает обязательные поля', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page.getByText('Обязательное поле')).toHaveCount(2);
});

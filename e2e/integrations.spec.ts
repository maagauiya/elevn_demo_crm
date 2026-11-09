import { expect, test } from '@playwright/test';
import { login } from './helpers';

declare global {
  interface Window {
    __printed?: number;
    /** Симулятор АТС (src/features/telephony/model/simulator.ts), есть только в режиме моков. */
    __elevnAts?: { incoming: (phone: string) => string; answer: (id?: string) => void; hangup: (id?: string) => void };
  }
}

test.beforeEach(async ({ page }) => {
  // window.print в тестах подменяем счётчиком; afterprint шлём сами.
  await page.addInitScript(() => {
    window.__printed = 0;
    window.print = () => {
      window.__printed = (window.__printed ?? 0) + 1;
      setTimeout(() => window.dispatchEvent(new Event('afterprint')), 300);
    };
  });
  await login(page);
  await page.waitForURL((url) => !url.pathname.includes('login'));
});

test('входящий звонок: карточка клиента → «Записать» с клиентом', async ({ page }) => {
  await page.goto('/logbook?date=2026-11-09');
  await expect(page.getByText('12 специалистов')).toBeVisible();
  await page.waitForFunction(() => Boolean(window.__elevnAts));
  await page.evaluate(() => window.__elevnAts?.incoming('+77011234567'));
  const card = page.getByRole('status', { name: 'Входящий звонок' });
  await expect(card.getByText('Смирнова Анна Петровна')).toBeVisible();
  await expect(card.getByText('Петрова А. С., Ким Д. В.')).toBeVisible();
  await card.getByRole('button', { name: 'Записать' }).click();
  const dialog = page.getByRole('dialog', { name: 'Новая запись' });
  await expect(dialog.getByText(/Смирнова Анна Петровна/)).toBeVisible();
});

test('пропущенный звонок фиксируется', async ({ page }) => {
  await page.goto('/logbook?date=2026-11-09');
  await page.waitForFunction(() => Boolean(window.__elevnAts));
  const saved = page.waitForRequest((r) => (r.postData() ?? '').includes('WAATSOnCallEnd'));
  await page.evaluate(() => {
    window.__elevnAts?.incoming('77011234567');
    window.__elevnAts?.hangup();
  });
  const request = await saved;
  expect(request.postData()).toContain('"StateId":2');
  await expect(page.getByRole('status', { name: 'Пропущенный звонок' })).toBeVisible();
});

test('WhatsApp: инстанс, QR и переписка из карточки записи', async ({ page }) => {
  await page.getByRole('button', { name: /Логинова Дарья/ }).click();
  await page.getByRole('menuitem', { name: 'WhatsApp' }).click();
  const dialog = page.getByRole('dialog', { name: 'Инстансы WhatsApp' });
  await expect(dialog.getByText('Не авторизован — отсканируйте QR-код')).toBeVisible();
  await dialog.getByRole('button', { name: 'Показать QR-код' }).click();
  await expect(dialog.getByRole('img', { name: 'Показать QR-код' })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.goto('/logbook?date=2026-11-09');
  await page
    .getByRole('button', { name: /^\d{2}:\d{2}–\d{2}:\d{2}, / })
    .first()
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Написать в WhatsApp' }).click();
  const chat = page.getByRole('dialog', { name: /^Переписка/ });
  await expect(chat.getByText('Спасибо, буду.')).toBeVisible();
  await chat.getByRole('textbox', { name: 'Сообщение' }).fill('Ждём вас завтра');
  await chat.getByRole('button', { name: 'Отправить' }).click();
  await expect(chat.getByText('Ждём вас завтра')).toBeVisible();
});

test('печать дня и талона', async ({ page }) => {
  await page.goto('/logbook?date=2026-11-09');
  await expect(page.getByText('12 специалистов')).toBeVisible();
  await page.getByRole('button', { name: 'Печать' }).click();
  const printRoot = page.locator('.print-root');
  await expect(printRoot).toBeAttached();
  await expect(printRoot.locator('table').first()).toBeAttached();
  await expect.poll(() => page.evaluate(() => window.__printed)).toBe(1);
  await expect(printRoot).toHaveCount(0); // убрался после afterprint

  await page
    .getByRole('button', { name: /^\d{2}:\d{2}–\d{2}:\d{2}, / })
    .first()
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Печать талона' }).click();
  await expect(page.locator('.print-root')).toContainText('Талон записи');
  await expect.poll(() => page.evaluate(() => window.__printed)).toBe(2);
});

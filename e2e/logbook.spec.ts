import { expect, test } from '@playwright/test';
import { login } from './helpers';

test.describe('журнал записей', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForURL((url) => !url.pathname.includes('login'));
  });

  test('показывает сетку дня и открывает запись', async ({ page }) => {
    await page.goto('/logbook?date=2026-11-09');
    await expect(page.getByText('12 специалистов')).toBeVisible();
    await page
      .getByRole('button', { name: /^\d{2}:\d{2}–\d{2}:\d{2}, / })
      .first()
      .click();
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByText('Время')).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Изменить' })).toBeVisible();
  });

  test('день и фильтр живут в URL', async ({ page }) => {
    await page.goto('/logbook?date=2026-11-09');
    await page.getByRole('button', { name: 'Следующий день' }).click();
    await expect(page).toHaveURL(/date=2026-11-10/);
    await page.getByRole('button', { name: 'Только с записями' }).click();
    await expect(page).toHaveURL(/busy=1/);
  });

  test('создаёт запись через быструю запись', async ({ page }) => {
    await page.goto('/logbook?date=2026-11-09');
    await expect(page.getByText('12 специалистов')).toBeVisible();
    await page.getByRole('button', { name: 'Быстрая запись' }).click();
    const dialog = page.getByRole('dialog', { name: 'Новая запись' });
    await dialog.getByPlaceholder('ФИО, телефон или номер карты').fill('7701');
    await dialog.getByRole('list', { name: 'Клиент' }).getByRole('button').first().click();
    await dialog.getByRole('combobox', { name: /Специалист/ }).click();
    await page.getByRole('option').first().click();
    await dialog.getByLabel(/Время/).fill('21:00');
    await dialog.getByRole('button', { name: 'Записать' }).click();
    await expect(page.getByText('Запись создана')).toBeVisible();
    await expect(page.getByRole('button', { name: /^21:00–21:30, / })).toBeVisible();
  });

  test('переносит запись мышью и отменяет перенос', async ({ page }) => {
    // Неделя специалиста: все 7 дней на экране
    await page.goto('/id/2000?date=2026-11-09');
    const candidates = page.getByRole('button', {
      name: /^(09|1[0-6]):\d{2}–\d{2}:\d{2}, .*(Подтвержденная|Предварительная)/,
    });
    await candidates.first().waitFor();
    const viewport = page.viewportSize() ?? { width: 1280, height: 720 };
    let label = '';
    let box: { x: number; y: number; width: number; height: number } | null = null;
    for (const card of await candidates.all()) {
      const b = await card.boundingBox();
      if (b && b.y > 150 && b.y + 100 < viewport.height) {
        box = b;
        label = (await card.getAttribute('aria-label')) ?? '';
        break;
      }
    }
    if (!box) throw new Error('нет видимой карточки для переноса');
    await page.mouse.move(box.x + box.width / 2, box.y + 4);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + 14, { steps: 3 });
    await page.mouse.move(box.x + box.width / 2, box.y + 4 + 80, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByText('Запись перенесена')).toBeVisible();
    await expect(page.getByRole('button', { name: label, exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Отменить' }).click();
    await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
  });

  test('изменяет, копирует и удаляет запись', async ({ page }) => {
    await page.goto('/id/2000?date=2026-11-09');
    const card = page
      .getByRole('button', { name: /^\d{2}:\d{2}–\d{2}:\d{2}, .*(Подтвержденная|Предварительная)/ })
      .first();
    await card.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Изменить' }).click();
    const edit = page.getByRole('dialog', { name: 'Изменить запись' });
    await edit.getByLabel(/Начало/).fill('07:00');
    await edit.getByLabel(/Окончание/).fill('07:45');
    await edit.getByRole('button', { name: 'Сохранить' }).click();
    const moved = page.getByRole('button', { name: /^07:00–07:45, / }).first();
    await expect(moved).toBeVisible();

    await moved.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Копировать' }).click();
    const copy = page.getByRole('dialog', { name: 'Копировать запись' });
    await copy.getByLabel(/Начало/).fill('06:00');
    await copy.getByRole('button', { name: 'Копировать' }).click();
    await expect(page.getByText('Запись скопирована')).toBeVisible();
    const copied = page.getByRole('button', { name: /^06:00–06:45, / }).first();
    await expect(copied).toBeVisible();

    await copied.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Удалить' }).click();
    await page.getByRole('dialog', { name: 'Удалить запись?' }).getByRole('button', { name: 'Удалить' }).click();
    await expect(page.getByText('Событие удалено')).toBeVisible();
    await expect(page.getByRole('button', { name: /^06:00–06:45, / })).toHaveCount(0);
  });

  test('кабинеты, групповые занятия и поиск клиента', async ({ page }) => {
    await page.goto('/offices?date=2026-11-09');
    await expect(page.getByText(/2 кабинета · \d+/)).toBeVisible();
    await page.goto('/training?date=2026-11-09');
    await expect(page.getByRole('button', { name: /^10:00–11:00, Йога/ })).toBeVisible();

    await page.goto('/logbook?date=2026-11-09');
    await page.getByRole('button', { name: 'Найти клиента' }).click();
    const search = page.getByRole('dialog', { name: 'Поиск клиента' });
    await search.getByRole('searchbox').fill('7701');
    await search.getByRole('list').getByRole('button').first().click();
    await search.getByRole('button', { name: /10\.11\.2026/ }).click();
    await expect(page).toHaveURL(/date=2026-11-10/);
  });
});

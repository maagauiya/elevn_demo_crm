import { Faker, en, ru } from '@faker-js/faker';

/**
 * Генератор синтетических данных. Seed фиксирован, чтобы данные не «прыгали» между перезагрузками
 * и тесты были детерминированными. Только вымышленные данные — никаких выгрузок реальных пациентов.
 */
export const fake = new Faker({ locale: [ru, en] });
fake.seed(20261108);

/** Отдельный генератор со своим seed — чтобы одна фича не сдвигала данные другой. */
export function createFaker(seed: number) {
  const instance = new Faker({ locale: [ru, en] });
  instance.seed(seed);
  return instance;
}

import { normalizeAtsPhone, serverDateTime } from './phone';
import { createSimulator } from './simulator';
import type { CallEvent } from './types';

describe('телефония', () => {
  it('нормализует номер как в базе', () => {
    expect(normalizeAtsPhone('+77076281068')).toBe('7076281068');
    expect(normalizeAtsPhone('77076281068')).toBe('7076281068');
    expect(normalizeAtsPhone('87076281068')).toBe('7076281068');
    expect(normalizeAtsPhone('7076281068')).toBe('7076281068');
  });

  it('формат времени для WAATSOnCallEnd', () => {
    expect(serverDateTime(new Date(2026, 10, 9, 14, 5, 7).getTime() / 1000)).toBe('2026-11-09 14:05:07');
  });

  it('симулятор: входящий → ответ → завершение', () => {
    const sim = createSimulator();
    const events: CallEvent[] = [];
    sim.onEvent((e) => events.push(e));
    sim.connect();
    const id = window.__elevnAts?.incoming('77076281068') ?? '';
    window.__elevnAts?.answer(id);
    window.__elevnAts?.hangup(id);
    expect(events.map((e) => e.kind)).toEqual(['incoming', 'answered', 'ended']);
    expect(events[2]?.direction).toBe('in');
    sim.disconnect();
    expect(window.__elevnAts).toBeUndefined();
  });
});

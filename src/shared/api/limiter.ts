/** Ограничивает число одновременных запросов (в старом фронте — MAX_REQUESTS через setInterval). */
export function createLimiter(max: number) {
  let active = 0;
  const queue: (() => void)[] = [];

  const next = () => {
    if (active >= max) return;
    const run = queue.shift();
    if (run) {
      active += 1;
      run();
    }
  };

  return async function limit<T>(task: () => Promise<T>): Promise<T> {
    await new Promise<void>((resolve) => {
      queue.push(resolve);
      next();
    });
    try {
      return await task();
    } finally {
      active -= 1;
      next();
    }
  };
}

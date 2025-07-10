import { c, Str } from './common.ts';

/**
 * Helpers for logging.
 */
export const Log = {
  memory() {
    const mem = Deno.memoryUsage();
    const ts = new Date().toLocaleTimeString();

    const bytes = (value: number) => c.white(Str.bytes(value));
    const rss = bytes(mem.rss);
    const heapUsed = bytes(mem.heapUsed);
    const heapTotal = bytes(mem.heapTotal);

    const msg = `⏱ Memory ${ts} — RSS ${rss}, Heap Used ${heapUsed}, Heap Total ${heapTotal}`;
    console.info(c.gray(msg));
  },
} as const;

import { type t, c, Cli, pkg, rx, Str, Time } from './common.ts';

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

  server(args: { port: t.PortNumber; dir?: t.StringDir }) {
    const { port, dir } = args;

    const table = Cli.table([]);
    const module = c.gray(`${c.bold(c.white(pkg.name))}/${c.green('server')} ${pkg.version}`);
    const url1 = c.cyan(`http://localhost:${c.bold(String(port))}`);
    const url2 = c.cyan(`  ws://localhost:${c.bold(String(port))}`);

    table.push([c.gray('  Module:'), module]);
    table.push([c.gray('  Transport:'), c.green('websocket')]);
    table.push([c.gray('  Storage:'), c.gray((dir ?? '').trim() || '<no storage>')]);
    table.push([c.gray('  Endpoint:'), url1]);
    table.push(['', url2]);

    console.info();
    console.info(table.toString().trim());
    console.info();
  },

  startInterval(life: t.UntilInput, log?: () => void) {
    const time = Time.until(life);
    const heartbeat = () => {
      log?.();
      time.delay(5 * 60_000, heartbeat);
    };
    heartbeat(); // ← Kick-off heartbeat.

    const $ = rx.subject();
    $.pipe(rx.debounceTime(3_000)).subscribe(() => log?.());

    /**
     * API:
     */
    const api = {
      log: () => log?.(),
      ping: () => $.next(),
    };
    return api;
  },
} as const;

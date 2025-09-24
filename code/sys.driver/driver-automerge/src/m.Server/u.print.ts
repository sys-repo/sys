import { type t, c, Cli, Fs, pkg, Pkg, rx, Str, Time } from './common.ts';

/**
 * Helpers for logging.
 */
export const Log = {
  divider: () => console.info('\u200B'), // ← zero-width space (prevents line collapse in linux logs).

  async metrics(options: { dir?: t.StringDir; pad?: boolean } = {}) {
    const { dir, pad = false } = options;
    if (pad) Log.divider();
    Log.memory();
    await Log.dir(dir);
    if (pad) Log.divider();
  },

  memory() {
    const mem = Deno.memoryUsage();
    const ts = timestamp();

    const bytes = (value: number) => c.white(Str.bytes(value));
    const rss = bytes(mem.rss);
    const heapUsed = bytes(mem.heapUsed);
    const heapTotal = bytes(mem.heapTotal);
    const bullet = c.bold(c.cyan('⏱'));

    const title = `${bullet} ${ts}`;
    const msg = `  Memory:     RSS ${rss}, ${c.cyan('Heap Used')} ${heapUsed}, Heap Total ${heapTotal}`;

    console.info(c.gray(title));
    console.info(c.gray(`  Module:     ${Pkg.toString(pkg)}`));
    console.info(c.gray(msg));
  },

  async dir(path?: t.StringDir) {
    if (!path) return;
    const size = await Fs.Size.dir(path);
    const total = c.white(Str.bytes(size.total.bytes));
    const msg = `  Filesystem: ${total}`;
    console.info(c.gray(msg));
  },

  server(args: { port: t.PortNumber; host?: string; dir?: t.StringDir }) {
    const { port, dir, host = 'localhost' } = args;

    const table = Cli.table([]);
    const module = c.gray(`${c.bold(c.white(pkg.name))}/${c.green('server')} ${pkg.version}`);
    const url1 = c.cyan(`http://${host}:${c.bold(String(port))}`);
    const url2 = c.cyan(`  ws://${host}:${c.bold(String(port))}`);

    table.push([c.gray('  Module:'), module]);
    table.push([c.gray('  Transport:'), c.green('websocket')]);
    table.push([c.gray('  Storage:'), c.gray((dir ?? '').trim() || '<no storage>')]);
    table.push([c.gray('  Endpoint:'), url1]);
    table.push(['', url2]);

    console.info();
    console.info(table.toString().trim());
  },

  startInterval(
    life: t.UntilInput,
    log?: () => void,
    options: { debounce?: t.Msecs; heartbeatDelay?: t.Msecs } = {},
  ) {
    const { debounce = 3_000, heartbeatDelay = 30 * 60_000 } = options;

    const $ = rx.subject();
    $.pipe(rx.debounceTime(debounce)).subscribe(() => log?.());

    const time = Time.until(life);
    const heartbeat = (log: boolean = true) => {
      if (log) $.next();
      time.delay(heartbeatDelay, heartbeat);
    };
    heartbeat(false); // ← Kick-off heartbeat.

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

/**
 * Helpers:
 */
export function timestamp(): string {
  const now = new Date();
  const zoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fmt = new Intl.DateTimeFormat(undefined, {
    timeZone: zoneName,
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
  const parts = fmt.formatToParts(now);

  let time = '';
  let period = '';
  let zone = '';

  for (const p of parts) {
    switch (p.type) {
      case 'hour':
      case 'minute':
      case 'second':
      case 'literal':
        time += p.value;
        break;
      case 'dayPeriod':
        period = p.value.toLowerCase(); // ← am/pm
        break;
      case 'timeZoneName':
        zone = p.value;
        break;
    }
  }

  return `${zone} / ${time.trim()}${period}`;
}

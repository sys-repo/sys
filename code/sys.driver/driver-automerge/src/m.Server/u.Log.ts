import { type t, c, Cli, Fs, pkg, rx, Str, Time } from './common.ts';

/**
 * Helpers for logging.
 */
export const Log = {
  async metrics(dir?: t.StringDir) {
    Log.memory();
    await Log.dir(dir);
  },

  memory() {
    const mem = Deno.memoryUsage();
    const ts = new Date().toLocaleTimeString(undefined, { timeZoneName: 'short' });

    const bytes = (value: number) => c.white(Str.bytes(value));
    const rss = bytes(mem.rss);
    const heapUsed = bytes(mem.heapUsed);
    const heapTotal = bytes(mem.heapTotal);
    const bullet = c.cyan('⏱');

    const title = `${bullet} ${ts}`;
    const msg = `  Memory — RSS ${rss}, Heap Used ${heapUsed}, Heap Total ${heapTotal}`;

    console.info(c.gray(title));
    console.info(c.gray(msg));
  },

  async dir(path?: t.StringDir) {
    if (!path) return;
    const size = await Fs.Size.dir(path);
    const total = c.white(Str.bytes(size.total.bytes));
    const msg = `  Filesystem: ${total}`;
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

  startInterval(
    life: t.UntilInput,
    log?: () => void,
    options: { debounce?: t.Msecs; heartbeatDelay?: t.Msecs } = {},
  ) {
    const { debounce = 3_000, heartbeatDelay = 30 * 60_000 } = options;

    const $ = rx.subject();
    $.pipe(rx.debounceTime(debounce)).subscribe(() => log?.());

    const time = Time.until(life);
    const heartbeat = () => {
      $.next();
      time.delay(heartbeatDelay, heartbeat);
    };
    heartbeat(); // ← Kick-off heartbeat.

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

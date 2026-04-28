import { Dispose, type t } from './common.ts';
import { keyboard } from './u.keyboard.ts';
import { options as createOptions } from './u.options.ts';

type F = t.HttpServerLib['start'];

/**
 * Start a Hono app as a managed HTTP server lifecycle.
 */
export const start: F = (app, input = {}) => {
  const hostname = (input.hostname ?? '127.0.0.1') as t.StringHostname;
  const controller = new AbortController();
  const baseOptions = createOptions({
    port: input.port,
    pkg: input.pkg,
    hash: input.hash,
    silent: input.silent,
    dir: input.dir,
  });

  const server = Deno.serve({ ...baseOptions, hostname }, app.fetch);
  const addr = server.addr as Deno.NetAddr;
  const port = addr.port as t.PortNumber;
  const origin = wrangle.origin({ hostname, port });

  let closing: Promise<void> | undefined;
  let removeSignalBridge = () => {};

  const life = Dispose.lifecycleAsync(input.until, async (e) => {
    removeSignalBridge();
    closing ??= closeServer({ server, controller, reason: e.reason });
    await closing;
  });

  const context: t.HttpServerStarted = {
    app,
    server,
    addr,
    hostname,
    port,
    origin,
    signal: controller.signal,
    finished: server.finished,

    get disposed() {
      return life.disposed;
    },

    get dispose$() {
      return life.dispose$;
    },

    async dispose(reason) {
      await life.dispose(reason);
    },

    async close(reason) {
      await life.dispose(reason);
    },
  };

  wrangle.externalSignal(input.signal, context, (fn) => (removeSignalBridge = fn));
  wrangle.serverFinished(server, life);
  wrangle.keyboard(input.keyboard, context);

  return context;
};

/**
 * Helpers:
 */
async function closeServer(args: {
  readonly server: Deno.HttpServer<Deno.NetAddr>;
  readonly controller: AbortController;
  readonly reason?: unknown;
}) {
  if (!args.controller.signal.aborted) args.controller.abort(args.reason);
  await args.server.shutdown();
  await args.server.finished;
}

const wrangle = {
  origin(args: { readonly hostname: string; readonly port: t.PortNumber }): t.StringUrl {
    const hostname = args.hostname;
    const host = wrangle.isLocalHostname(hostname) ? 'localhost' : wrangle.urlHost(hostname);
    return `http://${host}:${args.port}` as t.StringUrl;
  },

  isLocalHostname(hostname: string) {
    return hostname === '0.0.0.0' || hostname === '::' || hostname === '127.0.0.1' ||
      hostname === '::1';
  },

  urlHost(hostname: string) {
    return hostname.includes(':') && !hostname.startsWith('[') ? `[${hostname}]` : hostname;
  },

  externalSignal(
    signal: AbortSignal | undefined,
    context: t.HttpServerStarted,
    setRemove: (fn: () => void) => void,
  ) {
    if (!signal) return;

    const dispose = () => void context.dispose(signal.reason);
    if (signal.aborted) return dispose();

    signal.addEventListener('abort', dispose, { once: true });
    setRemove(() => signal.removeEventListener('abort', dispose));
  },

  serverFinished(server: Deno.HttpServer<Deno.NetAddr>, life: t.LifecycleAsync) {
    void server.finished.then(
      () => {
        if (!life.disposed) void life.dispose('server.finished');
      },
      () => {
        if (!life.disposed) void life.dispose('server.finished');
      },
    );
  },

  keyboard(input: t.HttpServerStartOptions['keyboard'], context: t.HttpServerStarted) {
    const options = wrangle.keyboardOptions(input);
    if (!options) return;

    void keyboard({
      port: context.port,
      url: context.origin,
      print: options.print,
      exit: options.exit,
      dispose: () => context.close('keyboard'),
    }).catch((error) => {
      if (!context.disposed) console.warn(error);
    });
  },

  keyboardOptions(input: t.HttpServerStartOptions['keyboard']) {
    if (!input) return undefined;
    if (input === true) return { print: true, exit: false };
    return {
      print: input.print ?? true,
      exit: input.exit ?? false,
    };
  },
} as const;

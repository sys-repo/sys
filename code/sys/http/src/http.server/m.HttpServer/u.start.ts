import { Dispose, Err, type t } from './common.ts';
import { bindKeyboard } from './u.keyboard.ts';
import { localOrigin } from './u.origin.ts';
import { options as createOptions } from './u.options.ts';
import { print as printStarted } from './u.print.ts';
import { statusUrls } from './u.status.url.ts';

type F = t.HttpServer.Lib['start'];
type KeyboardOptions = { readonly print: boolean; readonly exit: boolean } | undefined;

/**
 * Start a Hono app as a managed HTTP server lifecycle.
 */
export const start: F = (app, input = {}) => {
  const hostname = (input.hostname ?? '127.0.0.1') as t.StringHostname;
  const controller = new AbortController();
  const keyboardOptions = wrangle.keyboardOptions(input.keyboard);
  const baseOptions = createOptions({
    port: input.port,
    pkg: input.pkg,
    hash: input.hash,
    name: input.name,
    info: input.info,
    silent: true,
    dir: input.dir,
    status: input.status,
  });

  const server = Deno.serve({ ...baseOptions, hostname }, app.fetch);
  const addr = server.addr as Deno.NetAddr;
  const port = addr.port as t.PortNumber;
  const origin = localOrigin({ hostname, port });

  let state: t.Service.State = 'ready';
  let error: t.StdError | undefined;
  let closing: Promise<void> | undefined;

  const life = Dispose.lifecycleAsync(input.until, async (e) => {
    state = 'stopping';
    try {
      closing ??= closeServer({ server, controller, reason: e.reason });
      await closing;
      state = 'stopped';
    } catch (cause) {
      state = 'error';
      error = wrangle.error(cause);
      throw cause;
    }
  });

  const context: t.HttpServer.Started = {
    app,
    server,
    addr,
    hostname,
    port,
    origin,
    signal: controller.signal,
    finished: server.finished,

    status() {
      return wrangle.status(input, { origin, state, error });
    },

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

  wrangle.serverFinished(server, life);
  const keyboardBound = wrangle.keyboard(keyboardOptions, context, input);
  wrangle.print(input, context, keyboardOptions, keyboardBound);

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
  status(
    input: t.HttpServer.Start.Options,
    context: {
      readonly origin: t.StringUrl;
      readonly state: t.Service.State;
      readonly error?: t.StdError;
    },
  ): t.Service.Status {
    const status = input.status;
    const root = status?.root ?? input.dir;
    const details = status?.details ?? wrangle.details(input.info);
    const error = context.error;

    return {
      state: context.state,
      kind: status?.kind ?? 'http',
      urls: statusUrls(context.origin, status?.urlPaths),
      ...(input.name ? { name: input.name } : {}),
      ...(root ? { root } : {}),
      ...(status?.config ? { config: status.config } : {}),
      ...(details.length > 0 ? { details } : {}),
      ...(error ? { error } : {}),
    };
  },

  details(info: Record<string, string> | undefined): readonly t.Service.Detail[] {
    return Object.entries(info ?? {}).map(([label, value]) => ({ label, value }));
  },

  error(cause: unknown): t.StdError {
    return Err.std(cause);
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

  keyboard(
    options: KeyboardOptions,
    context: t.HttpServer.Started,
    input: t.HttpServer.Start.Options,
  ): boolean {
    if (!options) return false;
    return bindKeyboard({
      port: context.port,
      url: wrangle.openUrl(input, context.origin),
      print: false,
      exit: options.exit,
      dispose: () => context.close('keyboard'),
      until: context.finished,
    });
  },

  keyboardOptions(input: t.HttpServer.Start.Options['keyboard']) {
    if (!input) return undefined;
    if (input === true) return { print: true, exit: false };
    return {
      print: input.print ?? true,
      exit: input.exit ?? false,
    };
  },

  openUrl(input: t.HttpServer.Start.Options, origin: t.StringUrl): t.StringUrl {
    return statusUrls(origin, input.status?.urlPaths)[0]?.href ?? origin;
  },

  print(
    input: t.HttpServer.Start.Options,
    context: t.HttpServer.Started,
    keyboardOptions: KeyboardOptions,
    keyboardBound: boolean,
  ) {
    if (input.silent) return;
    printStarted({
      addr: context.addr,
      pkg: input.pkg,
      hash: input.hash,
      name: input.name,
      info: input.info,
      requestedPort: input.port,
      dir: input.dir,
      status: input.status,
      keyboard: wrangle.printKeyboard(keyboardOptions, keyboardBound),
    });
  },

  printKeyboard(
    options: KeyboardOptions,
    keyboardBound: boolean,
  ): t.HttpServer.Print.Keyboard.Options | undefined {
    if (!options?.print || !keyboardBound) return undefined;
    return { open: 'O', quit: 'Ctrl+C or Q' };
  },
} as const;

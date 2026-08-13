import { Dispose, Err, type t } from '../common.ts';
import { bindKeyboard } from './u.keyboard.ts';
import { listenerOrigin, validateOriginMode } from './u.origin.ts';
import { options as createOptions } from './u.options.ts';
import { printWithOrigin as printStarted } from './u.print.ts';
import { statusUrls } from './u.status.url.ts';

type F = t.HttpServer.Lib['start'];
type KeyboardOptions = { readonly print: boolean; readonly exit: boolean } | undefined;
type StartValues = {
  readonly port?: t.PortNumber;
  readonly pkg?: t.Pkg;
  readonly hash?: t.StringHash;
  readonly name?: string;
  readonly info?: Record<string, string>;
  readonly silent?: boolean;
  readonly dir?: t.StringDir;
  readonly status?: t.HttpServer.Status.Options;
  readonly until?: t.UntilInput;
  readonly keyboard?: KeyboardOptions;
};

/**
 * Start a Hono app as a managed HTTP server lifecycle.
 */
export const start: F = (app, input = {}) => {
  const hostname = (input.hostname ?? '127.0.0.1') as t.StringHostname;
  const originMode = input.origin;
  validateOriginMode({ hostname, mode: originMode });
  const values = wrangle.values(input);
  const controller = new AbortController();
  const keyboardOptions = values.keyboard;
  const baseOptions = createOptions({
    port: values.port,
    pkg: values.pkg,
    hash: values.hash,
    name: values.name,
    info: values.info,
    silent: true,
    dir: values.dir,
    status: values.status,
  });

  let server: Deno.HttpServer<Deno.NetAddr> | undefined;
  let state: t.Service.State = 'ready';
  let error: t.StdError | undefined;

  const life = Dispose.lifecycleAsync(values.until, async (e) => {
    state = 'stopping';
    try {
      const current = server;
      if (current) await closeServer({ server: current, controller, reason: e.reason });
      state = 'stopped';
    } catch (cause) {
      state = 'error';
      error = wrangle.error(cause);
      throw cause;
    }
  });

  try {
    server = Deno.serve({ ...baseOptions, hostname }, app.fetch);
    const activeServer = server;
    const addr = activeServer.addr as Deno.NetAddr;
    const port = addr.port as t.PortNumber;
    const origin = listenerOrigin({ hostname, port, mode: originMode });

    const context: t.HttpServer.Started = {
      app,
      server: activeServer,
      addr,
      hostname,
      port,
      origin,
      signal: controller.signal,
      finished: activeServer.finished,

      status() {
        return wrangle.status(values, values.status, { origin, state, error });
      },

      get disposed() {
        return life.disposed;
      },

      get dispose$() {
        return life.dispose$;
      },

      dispose: life.dispose,
      [Symbol.asyncDispose]: life[Symbol.asyncDispose],
      close: life.dispose,
    };

    wrangle.serverFinished(activeServer, life);
    const keyboardBound = wrangle.keyboard(keyboardOptions, context, values.status);
    wrangle.print(values, context, keyboardOptions, keyboardBound);

    return context;
  } catch (cause) {
    const rollback = life.dispose(cause);
    void rollback.catch(() => undefined);
    throw cause;
  }
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
    input: Pick<t.HttpServer.Start.Options, 'name' | 'dir' | 'info'>,
    status: t.HttpServer.Status.Options | undefined,
    context: {
      readonly origin: t.StringUrl;
      readonly state: t.Service.State;
      readonly error?: t.StdError;
    },
  ): t.Service.Status {
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
    try {
      return Err.std(cause);
    } catch {
      return { name: 'Error', message: 'HTTP server shutdown failed' };
    }
  },

  serverFinished(server: Deno.HttpServer<Deno.NetAddr>, life: t.LifecycleAsync) {
    void server.finished.then(
      () => {
        if (!life.disposed) void life.dispose('server.finished').catch(() => undefined);
      },
      () => {
        if (!life.disposed) void life.dispose('server.finished').catch(() => undefined);
      },
    );
  },

  keyboard(
    options: KeyboardOptions,
    context: t.HttpServer.Started,
    status: t.HttpServer.Status.Options | undefined,
  ): boolean {
    if (!options) return false;
    return bindKeyboard({
      port: context.port,
      url: wrangle.openUrl(status, context.origin),
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

  openUrl(
    status: t.HttpServer.Status.Options | undefined,
    origin: t.StringUrl,
  ): t.StringUrl {
    return statusUrls(origin, status?.urlPaths)[0]?.href ?? origin;
  },

  print(
    input: StartValues,
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
    }, context.origin);
  },

  values(input: t.HttpServer.Start.Options): StartValues {
    return {
      port: input.port,
      pkg: input.pkg,
      hash: input.hash,
      name: input.name,
      info: input.info ? { ...input.info } : undefined,
      silent: input.silent,
      dir: input.dir,
      status: wrangle.statusOptions(input.status),
      until: input.until,
      keyboard: wrangle.keyboardOptions(input.keyboard),
    };
  },

  statusOptions(
    input: t.HttpServer.Status.Options | undefined,
  ): t.HttpServer.Status.Options | undefined {
    if (!input) return undefined;
    return {
      kind: input.kind,
      config: input.config,
      root: input.root,
      urlPaths: input.urlPaths?.map((item) =>
        typeof item === 'string' ? item : { path: item.path, label: item.label }
      ),
      details: input.details?.map((detail) => ({ label: detail.label, value: detail.value })),
    };
  },

  printKeyboard(
    options: KeyboardOptions,
    keyboardBound: boolean,
  ): t.HttpServer.Print.Keyboard.Options | undefined {
    if (!options?.print || !keyboardBound) return undefined;
    return { open: 'O', quit: 'Ctrl+C or Q' };
  },
} as const;

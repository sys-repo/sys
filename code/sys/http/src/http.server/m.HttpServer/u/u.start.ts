import { Cli, Dispose, Err, Is, type t } from '../common.ts';
import { bindKeyboard } from './u.keyboard.ts';
import { listenerOrigin, validateOriginMode } from './u.origin.ts';
import { options as createOptions } from './u.options.ts';
import { printWithOrigin as printStarted } from './u.print.ts';
import { statusUrls } from './u.status.url.ts';

type F = t.HttpServer.Lib['start'];

export type StartDependencies = {
  readonly bindKeyboard: typeof bindKeyboard;
};

const DEFAULT_DEPS: StartDependencies = { bindKeyboard };

type KeyboardOptions = { readonly print: boolean; readonly exit: boolean } | undefined;
type StartValues = {
  readonly port?: t.PortNumber;
  readonly strictPort?: boolean;
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
export const start: F = (app, input = {}) => startWith(DEFAULT_DEPS, app, input);

/** Package-internal HTTP server start dependency seam. */
export function startWith(
  deps: StartDependencies,
  app: Parameters<F>[0],
  input: NonNullable<Parameters<F>[1]> = {},
): ReturnType<F> {
  const hostname: t.StringHostname = input.hostname ?? '127.0.0.1';
  const originMode = input.origin;
  validateOriginMode({ hostname, mode: originMode });
  const values = wrangle.values(input);
  const controller = new AbortController();
  const keyboardOptions = values.keyboard;
  const baseOptions = createOptions({
    port: values.port,
    strictPort: values.strictPort,
    pkg: values.pkg,
    hash: values.hash,
    name: values.name,
    info: values.info,
    silent: true,
    dir: values.dir,
    status: values.status,
  });

  let server: Deno.HttpServer<Deno.NetAddr> | undefined;
  let keyboardOwner: ReturnType<typeof bindKeyboard>;
  let state: t.Service.State = 'ready';
  let error: t.StdError | undefined;

  const life = Dispose.lifecycleAsync(values.until, async (e) => {
    state = 'stopping';
    try {
      await closeRuntime({
        server,
        keyboard: keyboardOwner,
        controller,
        reason: e.reason,
      });
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
    const addr: Deno.NetAddr = activeServer.addr;
    const port: t.PortNumber = addr.port;
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
    keyboardOwner = wrangle.keyboard(
      deps.bindKeyboard,
      keyboardOptions,
      context,
      values.status,
    );
    if (keyboardOwner) wrangle.keyboardFinished(keyboardOwner, life);
    wrangle.print(values, context, keyboardOptions, keyboardOwner !== undefined);

    return context;
  } catch (cause) {
    try {
      void ownCompletion(life.dispose(cause));
    } catch {
      // Preserve the startup failure; upper owners may retain direct listener authority.
    }
    throw cause;
  }
}

/**
 * Helpers:
 */
async function ownCompletion(input: unknown): Promise<void> {
  try {
    await input;
  } catch {
    // Package-owned lifecycle observation cannot create an unhandled rejection.
  }
}

async function closeAfterSettlement(
  completion: Promise<void>,
  life: t.LifecycleAsync,
  reason: string,
): Promise<void> {
  await ownCompletion(completion);
  if (life.disposed) return;
  try {
    await life.dispose(reason);
  } catch {
    // The lifecycle retains its own sanitized shutdown error state.
  }
}

async function closeRuntime(args: {
  readonly server?: Deno.HttpServer<Deno.NetAddr>;
  readonly keyboard?: ReturnType<typeof bindKeyboard>;
  readonly controller: AbortController;
  readonly reason?: unknown;
}) {
  let failed = false;
  let failure: unknown;

  if (args.server) {
    try {
      await closeServer({ server: args.server, controller: args.controller, reason: args.reason });
    } catch (cause) {
      failed = true;
      failure = cause;
    }
  }
  if (args.keyboard) {
    try {
      await Cli.Keyboard.shutdown(args.keyboard);
    } catch (cause) {
      if (!failed) {
        failed = true;
        failure = cause;
      }
    }
  }

  if (failed) throw failure;
}

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
    void closeAfterSettlement(server.finished, life, 'server.finished');
  },

  keyboard(
    bind: typeof bindKeyboard,
    options: KeyboardOptions,
    context: t.HttpServer.Started,
    status: t.HttpServer.Status.Options | undefined,
  ) {
    if (!options) return;
    return bind({
      port: context.port,
      url: wrangle.openUrl(status, context.origin),
      print: false,
      exit: options.exit,
      dispose: () => context.close('keyboard'),
      until: context.finished,
    });
  },

  keyboardFinished(
    keyboard: NonNullable<ReturnType<typeof bindKeyboard>>,
    life: t.LifecycleAsync,
  ) {
    void closeAfterSettlement(keyboard.finished, life, 'keyboard.finished');
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
      strictPort: input.strictPort,
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
        Is.string(item) ? item : { path: item.path, label: item.label }
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

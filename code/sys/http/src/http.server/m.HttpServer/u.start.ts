import { Dispose, Str, type t } from './common.ts';
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
    name: input.name,
    info: input.info,
    silent: input.silent,
    dir: input.dir,
  });

  const server = Deno.serve({ ...baseOptions, hostname }, app.fetch);
  const addr = server.addr as Deno.NetAddr;
  const port = addr.port as t.PortNumber;
  const origin = wrangle.origin({ hostname, port });

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

  const context: t.HttpServerStarted = {
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

  status(
    input: t.HttpServerStartOptions,
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
      urls: wrangle.urls(context.origin, status?.urlPaths),
      ...(input.name ? { name: input.name } : {}),
      ...(root ? { root } : {}),
      ...(status?.config ? { config: status.config } : {}),
      ...(details.length > 0 ? { details } : {}),
      ...(error ? { error } : {}),
    };
  },

  urls(
    origin: t.StringUrl,
    paths: readonly t.HttpServerStatusUrlPath[] | undefined,
  ): readonly t.Service.Url[] {
    const items = paths && paths.length > 0 ? paths : ['/'] as const;
    return items.map((item) => {
      const path = typeof item === 'string' ? item : item.path;
      const label = typeof item === 'string' ? undefined : item.label;
      const href = wrangle.url(origin, path);
      return label ? { href, label } : { href };
    });
  },

  url(origin: t.StringUrl, path: string): t.StringUrl {
    const suffix = Str.trimLeadingSlashes(path);
    if (!suffix) return `${origin}/` as t.StringUrl;
    return `${origin}/${suffix}` as t.StringUrl;
  },

  details(info: Record<string, string> | undefined): readonly t.Service.Detail[] {
    return Object.entries(info ?? {}).map(([label, value]) => ({ label, value }));
  },

  error(cause: unknown): t.StdError {
    if (cause instanceof Error) return { name: cause.name, message: cause.message };
    return { name: 'Error', message: String(cause) };
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

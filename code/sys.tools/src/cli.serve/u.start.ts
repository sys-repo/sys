import { Err, Fs, Is, type t } from './common.ts';
import { startServer } from './m.server/u.startServer.ts';
import { resolveServeHost, resolveServePort } from './u.startOptions.ts';
import { ServeFs } from './u.yaml/mod.ts';

/** Start a static serve location from owner YAML. */
export async function start(args: t.ServeTool.StartArgs): Promise<t.ServeTool.StartResult> {
  const cwd = args.cwd ?? Fs.cwd('terminal');
  const config = Fs.resolve(cwd, args.config) as t.StringPath;
  const loaded = await ServeFs.loadLocation(config);
  if (!loaded.ok) throw loadError(config, loaded);

  const host = resolveServeHost(args.host, 'Serve.start');
  const port = resolveServePort(args.port, 'Serve.start');
  const context = await startContext({ config, location: loaded.location, host, port });

  let closed = false;
  let closePromise: Promise<void> | undefined;
  const finished = context.server.finished;
  void (async () => {
    try {
      await finished;
    } finally {
      closed = true;
    }
  })();
  const close = async () => {
    if (closed) return;
    closePromise ??= closeContext();
    await closePromise;
  };

  async function closeContext() {
    try {
      await context.close();
      closed = true;
    } catch (error) {
      closePromise = undefined;
      throw error;
    }
  }

  return {
    ok: true,
    cwd: loaded.cwd,
    config,
    location: context.location,
    host: context.host,
    hostname: context.hostname,
    port: context.port,
    baseUrl: context.baseUrl,
    url: context.url,
    finished,
    close,
  };
}

/**
 * Helpers:
 */
async function startContext(args: {
  config: t.StringPath;
  location: t.ServeTool.LocationYaml.Location;
  host: t.ServeTool.Host;
  port?: number;
}) {
  try {
    return await startServer(args.location, {
      host: args.host,
      port: args.port,
      silent: true,
      keyboard: false,
    });
  } catch (error) {
    throw startError(args.config, error);
  }
}

function loadError(
  config: t.StringPath,
  loaded: Extract<t.ServeTool.LocationYaml.LoadResult, { readonly ok: false }>,
): Error {
  const details = errorMessagesOf(loaded.errors);
  const suffix = details ? `\n${details}` : '';
  return new Error(`Serve.start: failed to load config: ${Fs.trimCwd(config)}${suffix}`);
}

function startError(config: t.StringPath, error: unknown): Error {
  const detail = Err.summary(error, { cause: true, stack: false });
  const suffix = detail ? `\n${detail}` : '';
  return new Error(`Serve.start: failed to start config: ${Fs.trimCwd(config)}${suffix}`, {
    cause: error,
  });
}

function errorMessagesOf(errors: readonly t.Schema.Error[]): string {
  return errors
    .map((error) => {
      const message = (error as { readonly message?: unknown }).message;
      return Is.str(message) ? message.trim() : '';
    })
    .filter((message) => message.length > 0)
    .join('\n');
}

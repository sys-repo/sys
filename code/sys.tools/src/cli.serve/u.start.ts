import { Err, Fs, type t } from './common.ts';
import { startServer } from './m.server/u.startServer.ts';
import { resolveServeHost, resolveServePort } from './u.startOptions.ts';
import { loadStartTarget } from './u.startTarget.ts';
import { statusError, statusOf } from './u.status.ts';
import { distStatusDetails } from './u.status.dist.ts';

/** Start a static serve target from a directory, config path, or named profile. */
export async function start(args: t.ServeTool.StartArgs): Promise<t.ServeTool.StartResult> {
  const cwd = args.cwd ?? Fs.cwd('terminal');
  const target = await loadStartTarget(cwd, args, 'Serve.start');
  const host = resolveServeHost(args.host, 'Serve.start');
  const port = resolveServePort(args.port, 'Serve.start');
  const context = await startContext({ target, host, port, until: args.until });
  const artifactDetails = await distStatusDetails(target.location);

  let state: t.Service.State = 'ready';
  let error: t.StdError | undefined;
  let failed = false;
  let closed = false;
  let closePromise: Promise<void> | undefined;
  const finished = context.server.finished;
  void (async () => {
    try {
      await finished;
      if (!failed) state = 'stopped';
    } catch (cause) {
      failed = true;
      state = 'error';
      error = statusError(cause);
    } finally {
      closed = true;
    }
  })();
  const close = async (reason?: unknown) => {
    if (closed) return;
    state = 'stopping';
    closePromise ??= closeContext(reason);
    await closePromise;
  };

  async function closeContext(reason?: unknown) {
    try {
      await context.close(reason);
      closed = true;
      state = 'stopped';
    } catch (cause) {
      failed = true;
      state = 'error';
      error = statusError(cause);
      closePromise = undefined;
      throw cause;
    }
  }

  return {
    ok: true,
    cwd: target.cwd,
    selector: target.selector,
    config: target.config,
    location: context.location,
    host: context.host,
    hostname: context.hostname,
    port: context.port,
    baseUrl: context.baseUrl,
    url: context.url,
    finished,
    status() {
      return statusOf({ target, context, state, error, artifactDetails });
    },
    close,
  };
}

/**
 * Helpers:
 */
async function startContext(args: {
  target: t.ServeTool.StartTarget;
  host: t.ServeTool.Host;
  port?: number;
  until?: t.UntilInput;
}) {
  try {
    return await startServer(args.target.location, {
      host: args.host,
      port: args.port,
      silent: true,
      keyboard: false,
      until: args.until,
    });
  } catch (error) {
    throw startError(args.target, error);
  }
}

function startError(target: t.ServeTool.StartTarget, error: unknown): Error {
  const detail = Err.summary(error, { cause: true, stack: false });
  const suffix = detail ? `\n${detail}` : '';
  const [kind, path] = target.config ? ['config', target.config] : ['dir', target.location.dir];
  return new Error(`Serve.start: failed to start ${kind}: ${Fs.trimCwd(path)}${suffix}`, {
    cause: error,
  });
}

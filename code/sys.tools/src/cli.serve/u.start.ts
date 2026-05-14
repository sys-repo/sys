import { Err, Fs, type t } from './common.ts';
import { startServer } from './m.server/u.startServer.ts';
import { resolveServeHost, resolveServePort } from './u.startOptions.ts';
import { loadStartTarget } from './u.startTarget.ts';

/** Start a static serve target from a directory, config path, or named profile. */
export async function start(args: t.ServeTool.StartArgs): Promise<t.ServeTool.StartResult> {
  const cwd = args.cwd ?? Fs.cwd('terminal');
  const target = await loadStartTarget(cwd, args, 'Serve.start');
  const host = resolveServeHost(args.host, 'Serve.start');
  const port = resolveServePort(args.port, 'Serve.start');
  const context = await startContext({ target, host, port, until: args.until });

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
  const close = async (reason?: unknown) => {
    if (closed) return;
    closePromise ??= closeContext(reason);
    await closePromise;
  };

  async function closeContext(reason?: unknown) {
    try {
      await context.close(reason);
      closed = true;
    } catch (error) {
      closePromise = undefined;
      throw error;
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

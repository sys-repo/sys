import {
  Files,
  FilesStatic,
  FsPkg,
  HttpServer,
  Rx,
  Schedule,
  serveFileBytes,
  type t,
} from '../common.ts';
import { DistServerError, startError, startupReason } from './u.server.error.ts';
import { acceptedAuthorities, acceptsHost } from './u.server.host.ts';
import { snapshotStartInput } from './u.server.input.ts';
import { requestPath } from './u.server.path.ts';
import { readAsset } from './u.server.read.ts';

export type StartDependencies = Readonly<{
  verify: t.FsPkg.Dist.Pinned.Verify.Method;
  readPart: t.FsPkg.Dist.Pinned.ReadPart.Method;
  fromDist: typeof FilesStatic.fromDist;
  createApp: typeof HttpServer.create;
  startHttp: typeof HttpServer.start;
  serveBytes: typeof serveFileBytes;
}>;

export const DEFAULT_DEPENDENCIES: StartDependencies = Object.freeze({
  verify: FsPkg.Dist.Pinned.verify,
  readPart: FsPkg.Dist.Pinned.readPart,
  fromDist: FilesStatic.fromDist,
  createApp: HttpServer.create,
  startHttp: HttpServer.start,
  serveBytes: serveFileBytes,
});

/** Start one checksum-pinned local Dist host. */
export const start: t.DistServer.Start = (input) => startWith(input, DEFAULT_DEPENDENCIES);

/** Internal deterministic dependency seam. */
export async function startWith(
  input: unknown,
  deps: StartDependencies,
): Promise<t.HttpServer.Started> {
  const prepared = snapshotStartInput(input);
  if (!prepared.ok) throw startError(prepared.reason);
  const args = prepared.value;

  let life: t.Abortable;
  try {
    life = Rx.abortable(args.until);
  } catch {
    throw startError('invalid-input');
  }

  let started: t.HttpServer.Started | undefined;
  try {
    await Schedule.micro();
    if (life.signal.aborted) throw startError('cancelled');

    let verified: t.FsPkg.Dist.Pinned.Verify.Result;
    try {
      verified = await deps.verify({
        dir: args.dir,
        integrity: args.integrity,
        limits: args.limits,
        until: life.signal,
      });
    } catch {
      throw startError('startup-failure');
    }
    if (verified.kind !== 'verified') throw startError(verified.kind);
    if (life.signal.aborted) throw startError('cancelled');

    let backing: t.FilesStatic.Readonly;
    try {
      backing = deps.fromDist({
        dist: verified.evidence.dist,
        policy: Files.Policy.readonly('**'),
      });
    } catch {
      throw startError('startup-failure');
    }

    const app = deps.createApp({ static: false, cors: false });
    const authority: { hosts?: ReadonlySet<string> } = {};
    app.all('*', (context) => {
      const request = context.req.raw;
      if (!authority.hosts || !acceptsHost(request, authority.hosts)) return hostRejected();

      const path = requestPath(request);
      if (!path) {
        return deps.serveBytes({
          req: request,
          path: 'invalid',
          cache: 'no-store',
          read: () => Promise.resolve({ kind: 'missing' }),
        });
      }

      return deps.serveBytes({
        req: request,
        path,
        cache: 'no-store',
        read: () => {
          return readAsset({
            backing,
            dir: args.dir,
            path,
            signal: request.signal,
            until: [life.signal, request.signal],
            deps,
          });
        },
      });
    });

    if (life.signal.aborted) throw startError('cancelled');
    try {
      started = deps.startHttp(app, {
        hostname: args.hostname,
        port: args.port,
        ...(args.name === undefined ? {} : { name: args.name }),
        ...(args.silent === undefined ? {} : { silent: args.silent }),
        ...(args.keyboard === undefined ? {} : { keyboard: args.keyboard }),
        until: life.signal,
        status: { kind: 'dist', root: args.dir, urlPaths: ['/'] },
      });
    } catch (cause) {
      throw startError(startupReason(cause));
    }
    if (args.port !== 0 && started.port !== args.port) throw startError('address-in-use');
    authority.hosts = acceptedAuthorities(started);
    await settleListener(started);
    if (life.signal.aborted) throw startError('cancelled');

    void started.finished
      .then(
        () => life.dispose('server.finished'),
        () => life.dispose('server.finished'),
      )
      .catch(() => {});
    return started;
  } catch (cause) {
    if (started) {
      try {
        await started.close('startup.failure');
      } catch {
        // Preserve the original sanitized startup failure.
      }
    }
    life.dispose();
    if (DistServerError.is(cause)) throw cause;
    throw startError('startup-failure');
  }
}

async function settleListener(started: t.HttpServer.Started): Promise<void> {
  let terminal: { readonly cause?: unknown } | undefined;
  void started.finished.then(
    () => (terminal = {}),
    (cause) => (terminal = { cause }),
  );
  await Schedule.macro();
  if (terminal) throw startError(startupReason(terminal.cause));
}

function hostRejected(): Response {
  return new Response(null, {
    status: 421,
    headers: {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

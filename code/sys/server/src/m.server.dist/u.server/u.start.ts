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
import { DistServerError, startError, startupReason } from './u.error.ts';
import { acceptedAuthorities, acceptsHost } from './u.host.ts';
import { snapshotStartInput, snapshotStartLocalInput } from './u.input.ts';
import { requestPath } from './u.path.ts';
import { readAsset } from './u.read.ts';

export type StartDependencies = Readonly<{
  verify: t.FsPkg.Dist.Pinned.Verify.Method;
  verifyLocal: t.FsPkg.Dist.Local.Verify.Method;
  readPart: t.FsPkg.Dist.Pinned.ReadPart.Method;
  fromDist: typeof FilesStatic.fromDist;
  createApp: typeof HttpServer.create;
  startHttp: typeof HttpServer.start;
  serveBytes: typeof serveFileBytes;
}>;

export const DEFAULT_DEPENDENCIES: StartDependencies = Object.freeze({
  verify: FsPkg.Dist.Pinned.verify,
  verifyLocal: FsPkg.Dist.Local.verify,
  readPart: FsPkg.Dist.Pinned.readPart,
  fromDist: FilesStatic.fromDist,
  createApp: HttpServer.create,
  startHttp: HttpServer.start,
  serveBytes: serveFileBytes,
});

/** Start one checksum-pinned local Dist host. */
export const start: (input: t.DistServer.Start.Args) => Promise<t.DistServer.Started> = (input) =>
  startWith(input, DEFAULT_DEPENDENCIES);

/** Start one local, non-authoritative checked Dist host. */
export const startLocal: (input: t.DistServer.Start.Local.Args) => Promise<t.DistServer.Started> =
  (input) =>
  startLocalWith(input, DEFAULT_DEPENDENCIES);

/** Internal deterministic dependency seam. */
export async function startWith(
  input: unknown,
  deps: StartDependencies,
): Promise<t.DistServer.Started> {
  const prepared = snapshotStartInput(input);
  if (!prepared.ok) throw startError(prepared.reason);

  let life: t.Abortable;
  try {
    life = Rx.abortable(prepared.value.until);
  } catch {
    throw startError('invalid-input');
  }

  try {
    await Schedule.micro();
    if (life.signal.aborted) throw startError('cancelled');

    let verified: t.FsPkg.Dist.Verify.Result;
    try {
      verified = await deps.verify({
        dir: prepared.value.dir,
        integrity: prepared.value.integrity,
        limits: prepared.value.limits,
        until: life.signal,
      });
    } catch {
      throw startError('startup-failure');
    }

    if (verified.kind !== 'verified') throw startError(verified.kind);
    if (life.signal.aborted) throw startError('cancelled');

    return await serveVerified(
      prepared.value,
      verified.evidence,
      { kind: 'pinned', integrity: prepared.value.integrity },
      life,
      deps,
    );
  } catch (cause) {
    life?.dispose();
    if (DistServerError.is(cause)) throw cause;
    throw startError('startup-failure');
  }
}

/** Internal deterministic local-hosting dependency seam. */
export async function startLocalWith(
  input: unknown,
  deps: StartDependencies,
): Promise<t.DistServer.Started> {
  const prepared = snapshotStartLocalInput(input);
  if (!prepared.ok) throw startError(prepared.reason);

  let life: t.Abortable;
  try {
    life = Rx.abortable(prepared.value.until);
  } catch {
    throw startError('invalid-input');
  }

  try {
    await Schedule.micro();
    if (life.signal.aborted) throw startError('cancelled');

    let verified: t.FsPkg.Dist.Verify.Result;
    try {
      verified = await deps.verifyLocal({
        dir: prepared.value.dir,
        limits: prepared.value.limits,
        until: life.signal,
      });
    } catch {
      throw startError('startup-failure');
    }

    if (verified.kind !== 'verified') throw startError(verified.kind);
    if (life.signal.aborted) throw startError('cancelled');

    return await serveVerified(
      prepared.value,
      verified.evidence,
      { kind: 'local-unpinned', integrity: verified.evidence.integrity },
      life,
      deps,
    );
  } catch (cause) {
    life?.dispose();
    if (DistServerError.is(cause)) throw cause;
    throw startError('startup-failure');
  }
}

async function serveVerified(
  input: t.DistServer.Start.Args | t.DistServer.Start.Local.Args,
  evidence: t.FsPkg.Dist.Verify.Evidence,
  authority: t.DistServer.Started['authority'],
  life: t.Abortable,
  deps: StartDependencies,
): Promise<t.DistServer.Started> {
  let started: t.HttpServer.Started | undefined;

  try {
    let backing: t.FilesStatic.Readonly;
    try {
      backing = deps.fromDist({
        dist: evidence.dist,
        policy: Files.Policy.readonly('**'),
      });
    } catch {
      throw startError('startup-failure');
    }

    const app = deps.createApp({ static: false, cors: false });
    const hosts = { hosts: undefined as undefined | ReadonlySet<string> };
    app.all('*', (context) => {
      const request = context.req.raw;
      if (!hosts.hosts || !acceptsHost(request, hosts.hosts)) return hostRejected();

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
            dir: input.dir,
            path,
            signal: life.signal,
            until: [life.signal, request.signal],
            deps,
          });
        },
      });
    });

    if (life.signal.aborted) throw startError('cancelled');
    try {
      started = deps.startHttp(app, {
        hostname: input.hostname,
        port: input.port,
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.silent === undefined ? {} : { silent: input.silent }),
        ...(input.keyboard === undefined ? {} : { keyboard: input.keyboard }),
        until: life.signal,
        status: { kind: 'dist', root: input.dir, urlPaths: ['/'] },
      });
    } catch (cause) {
      throw startError(startupReason(cause));
    }
    if (input.port !== 0 && started.port !== input.port) throw startError('address-in-use');
    hosts.hosts = acceptedAuthorities(started);
    await settleListener(started);
    if (life.signal.aborted) throw startError('cancelled');

    void started.finished.then(
      () => life.dispose('server.finished'),
      () => life.dispose('server.finished'),
    ).catch(() => {});

    Object.defineProperties(started, {
      authority: {
        value: Object.freeze(authority),
        enumerable: true,
        writable: false,
        configurable: false,
      },
      verification: {
        value: Object.freeze(evidence),
        enumerable: true,
        writable: false,
        configurable: false,
      },
    });

    return started as t.DistServer.Started;
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

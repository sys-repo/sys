import { Pinned, type t } from './common.ts';
import type { DistInput, RouteOperation } from './t.internal.ts';
import { objectKey, snapshotDist, snapshotDistRoutes } from './u.dist.ts';
import { createHandler } from './u.handler.ts';
import { createOperation } from './u.operation.ts';
import { readObject } from './u.read.ts';

type ManifestRead = { readonly bytes: Uint8Array } | t.R2.ReadRoute.FromDist.Failure;

/**
 * Fetch and verify a pinned `dist.json`, then apply the route policy to construct a handler.
 */
export async function fromDist(
  input: t.R2.ReadRoute.FromDist.Args,
): Promise<t.R2.ReadRoute.FromDist.Result> {
  let args: DistInput;
  try {
    args = snapshotDist(input);
  } catch {
    return Object.freeze({ kind: 'invalid-input' });
  }

  const signal = args.signal ?? new AbortController().signal;
  const stopped = Promise.withResolvers<t.R2.ReadRoute.FromDist.Failure>();
  let refusal: t.R2.ReadRoute.FromDist.Failure | undefined;
  let acquisition: RouteOperation | undefined;
  const stop = (kind: 'cancelled' | 'timeout') => {
    const result = refusal ?? Object.freeze({ kind });
    refusal = result;
    stopped.resolve(result);
    return result;
  };
  // Keep a recorded read timeout if the caller aborts afterwards.
  const onAbort = () => stop(acquisition?.status === 504 ? 'timeout' : 'cancelled');
  signal.addEventListener('abort', onAbort, { once: true });
  if (signal.aborted) onAbort();

  // Cancellation or timeout can return before work finishes; the race handles later rejections.
  return await Promise.race([construct(), stopped.promise]);

  /** Run the construction phases; keep the abort listener until this worker finishes. */
  async function construct(): Promise<t.R2.ReadRoute.FromDist.Result> {
    try {
      if (refusal) return refusal;
      const read = await readManifest();
      if (refusal) return refusal;
      if ('kind' in read) return read;

      // The read timeout has ended. Manifest verification and route selection have no deadline.
      const admitted = await Pinned.admitManifest({
        bytes: read.bytes,
        integrity: args.integrity,
        limits: args.manifestLimits,
        until: signal,
      });
      if (refusal) return refusal;
      if (admitted.kind === 'cancelled') return stop('cancelled');
      if (admitted.kind !== 'manifest-admitted') {
        return Object.freeze({ kind: 'manifest-refused', reason: admitted.kind });
      }

      return createHandlerFromManifest(admitted.evidence.dist);
    } finally {
      signal.removeEventListener('abort', onAbort);
    }
  }

  /** Sign and read the manifest, mapping failures and disposing the timeout after body cleanup. */
  async function readManifest(): Promise<ManifestRead> {
    const operation = createOperation(signal, args.limits.timeout);
    acquisition = operation;
    void operation.stopped.then((status) => stop(status === 504 ? 'timeout' : 'cancelled'));
    try {
      const read = await readObject(
        {
          ...args.source,
          limits: { maxBytes: args.manifestLimits.manifestBytes, timeout: args.limits.timeout },
        },
        objectKey(args.prefix, 'dist.json'),
        operation,
      );
      operation.check();
      if ('status' in read) {
        const status = read.status === 404 || read.status === 413 ? read.status : 502;
        return Object.freeze<t.R2.ReadRoute.FromDist.Failure>({ kind: 'read-refused', status });
      }
      return read;
    } catch {
      if (operation.status !== undefined) {
        return stop(operation.status === 504 ? 'timeout' : 'cancelled');
      }
      return Object.freeze<t.R2.ReadRoute.FromDist.Failure>({ kind: 'read-refused', status: 502 });
    } finally {
      // Dispose after the read and body cleanup finish, even if the public call returned earlier.
      operation.dispose();
      acquisition = undefined;
    }
  }

  /** Build synchronously so cancellation during the route policy wins before readiness. */
  function createHandlerFromManifest(
    dist: t.DeepReadonly<t.DistPkg>,
  ): t.R2.ReadRoute.FromDist.Result {
    let routes: ReadonlyMap<string, string>;
    try {
      const select = args.routes;
      const selected = select(dist);
      routes = snapshotDistRoutes(selected, args.prefix, dist);
    } catch {
      return refusal ?? Object.freeze({ kind: 'policy-refused' });
    }
    if (refusal) return refusal;
    const authorize = args.authorize;
    const handler = createHandler({
      ...args.source,
      routes,
      limits: args.limits,
      // The callback receives request context, not the handler's private configuration as `this`.
      authorize: (request) => authorize(request),
    });
    return Object.freeze({ kind: 'ready', handler });
  }
}

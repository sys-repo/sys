import type { t } from '../u.server.start/common.ts';
import type { BrowserRuntime } from '../u.server.browser/mod.ts';

type PublishVerifiedResultArgs = Readonly<{
  started: t.HttpServer.Started;
  authority: t.DistServer.Started['authority'];
  evidence: t.FsPkg.Dist.Verify.Evidence;
  browserRuntime: BrowserRuntime | undefined;
}>;

/**
 * Publish immutable authority and verification evidence on the admitted lower listener.
 */
export function publishVerifiedResult(
  args: PublishVerifiedResultArgs,
): t.DistServer.Started {
  const { started, authority, evidence, browserRuntime } = args;
  Object.defineProperties(started, {
    authority: fixed(Object.freeze(authority)),
    verification: fixed(Object.freeze(evidence)),
    ...(browserRuntime ? { browserPolicy: fixed(browserRuntime.applied) } : {}),
  });
  return started as t.DistServer.Started;
}

/**
 * Helpers:
 */
function fixed(value: unknown): PropertyDescriptor {
  return {
    value,
    enumerable: true,
    writable: false,
    configurable: false,
  };
}

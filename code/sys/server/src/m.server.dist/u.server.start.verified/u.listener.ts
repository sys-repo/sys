import type { StartDependencies, StartRunOptions, t } from '../u.server.start/common.ts';
import { startError, startupReason } from '../u.server/u.error.ts';

type StartVerifiedListenerArgs = {
  readonly app: Parameters<StartDependencies['startHttp']>[0];
  readonly input: t.DistServer.Start.Args | t.DistServer.Local.Args;
  readonly evidence: t.FsPkg.Dist.Verify.Evidence;
  readonly life: t.Abortable;
  readonly deps: StartDependencies;
  readonly strictPort: boolean;
  readonly options: StartRunOptions;
};

/**
 * Acquire the lower HTTP listener from the verified host's exact startup contract.
 *
 * Bind failures are classified without retaining their lower causes.
 */
export function startVerifiedListener(args: StartVerifiedListenerArgs): t.HttpServer.Started {
  const { app, input, evidence, life, deps, strictPort, options } = args;

  try {
    const listener: t.HttpServer.Start.Options = {
      hostname: input.hostname,
      port: input.port,
      strictPort,
      ...(input.browserPolicy === undefined ? {} : { origin: 'exact-loopback' }),
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.silent === undefined ? {} : { silent: input.silent }),
      ...(input.keyboard === undefined ? {} : { keyboard: input.keyboard }),
      ...(options.rawOutput
        ? {
          pkg: evidence.dist.pkg,
          hash: evidence.dist.hash.digest,
          ...(options.rawAuthority === undefined
            ? {}
            : { info: { authority: options.rawAuthority } }),
        }
        : {}),
      until: life.signal,
      status: { kind: 'dist', root: input.dir, urlPaths: ['/'] },
    };
    return deps.startHttp(app, listener);
  } catch (cause) {
    throw startError(startupReason(cause));
  }
}

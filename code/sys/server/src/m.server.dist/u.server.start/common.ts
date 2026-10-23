import {
  createHttpApp,
  FilesStatic,
  FsDistLocal,
  FsDistPinned,
  serveFileBytes,
  startHttp,
  type t,
} from '../common.server.ts';

export * from '../common.server.ts';
export { Cli } from '@sys/cli';
export { Open } from '@sys/process';
export { Is } from '@sys/std/is/server';

/**
 * Owner dependencies for verified Dist startup.
 */
export type StartDependencies = {
  readonly verify: t.FsPkg.Dist.Pinned.Verify.Method;
  readonly verifyLocal: t.FsPkg.Dist.Local.Verify.Method;
  readonly readPart: t.FsPkg.Dist.Pinned.ReadPart.Method;
  readonly readLocalPart: t.FsPkg.Dist.Local.ReadPart.Method;
  readonly fromDist: typeof FilesStatic.fromDist;
  readonly createApp: typeof createHttpApp;
  readonly startHttp: typeof startHttp;
  readonly serveBytes: typeof serveFileBytes;
};

/**
 * Package-internal controls for verified Dist startup.
 */
export type StartRunOptions = {
  readonly strictPort?: boolean;
  readonly rawOutput?: boolean;
  readonly rawAuthority?: string;
};

/**
 * Default authorities for verified Dist startup.
 */
export const DEFAULTS = Object.freeze({
  DEPS: Object.freeze({
    verify: FsDistPinned.verify,
    verifyLocal: FsDistLocal.verify,
    readPart: FsDistPinned.readPart,
    readLocalPart: FsDistLocal.readPart,
    fromDist: FilesStatic.fromDist,
    createApp: createHttpApp,
    startHttp,
    serveBytes: serveFileBytes,
  }) satisfies StartDependencies,
});

/** Short local alias for module defaults. */
export const D = DEFAULTS;

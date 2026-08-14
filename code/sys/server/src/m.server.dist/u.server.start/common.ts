import { FilesStatic, FsPkg, HttpServer, serveFileBytes, type t } from '../common.ts';

export * from '../common.ts';

export type StartDependencies = {
  readonly verify: t.FsPkg.Dist.Pinned.Verify.Method;
  readonly verifyLocal: t.FsPkg.Dist.Local.Verify.Method;
  readonly readPart: t.FsPkg.Dist.Pinned.ReadPart.Method;
  readonly fromDist: typeof FilesStatic.fromDist;
  readonly createApp: typeof HttpServer.create;
  readonly startHttp: typeof HttpServer.start;
  readonly serveBytes: typeof serveFileBytes;
};

export type StartRunOptions = {
  readonly strictPort?: boolean;
  readonly rawOutput?: boolean;
  readonly rawAuthority?: string;
};

export const DEFAULT_DEPENDENCIES: StartDependencies = Object.freeze({
  verify: FsPkg.Dist.Pinned.verify,
  verifyLocal: FsPkg.Dist.Local.verify,
  readPart: FsPkg.Dist.Pinned.readPart,
  fromDist: FilesStatic.fromDist,
  createApp: HttpServer.create,
  startHttp: HttpServer.start,
  serveBytes: serveFileBytes,
});

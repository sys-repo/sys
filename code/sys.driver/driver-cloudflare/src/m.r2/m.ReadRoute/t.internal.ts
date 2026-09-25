import type { t } from '../common.ts';

/** Captured signer and storage target, shared by manifest and request reads. */
export type RouteSource = {
  readonly bucketName: string;
  readonly storageOrigin: string;
  readonly sign: (key: string, timeout: number) => Promise<string>;
};

/** Read-engine input, independent of application routes and authorization. */
export type RouteReadConfig = RouteSource & {
  readonly limits: Readonly<Pick<t.R2.ReadRoute.Limits, 'maxBytes' | 'timeout'>>;
};

/** Private construction snapshot; no caller-owned mutable route table is retained. */
export type RouteConfig = RouteSource & {
  readonly routes: ReadonlyMap<string, string>;
  readonly limits: Readonly<t.R2.ReadRoute.Limits>;
  readonly authorize: t.R2.ReadRoute.Authorize;
};

/** Captured inputs; route selection runs only after the manifest passes verification. */
export type DistInput = {
  readonly source: RouteSource;
  readonly prefix: string;
  readonly integrity: string;
  readonly manifestLimits: t.FsPkg.Dist.Pinned.AdmitManifest.Limits;
  readonly limits: Readonly<t.R2.ReadRoute.Limits>;
  readonly authorize: t.R2.ReadRoute.Authorize;
  readonly routes: t.R2.ReadRoute.FromDist.Routes;
  readonly signal?: AbortSignal;
};

/** The worker disposes this operation after cleanup, even if the public call returned earlier. */
export type RouteOperation = {
  readonly signal: AbortSignal;
  readonly status: number | undefined;
  readonly stopped: Promise<number>;
  check(): void;
  dispose(): void;
};

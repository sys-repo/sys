import type { t } from '../common.ts';
export type * from '../t.internal.ts';

/** Private construction snapshot; no caller-owned mutable route table is retained. */
export type RouteConfig = {
  readonly bucketName: string;
  readonly storageOrigin: string;
  readonly routes: ReadonlyMap<string, string>;
  readonly limits: Readonly<t.R2.ReadRoute.Limits>;
  readonly authorize: t.R2.ReadRoute.Authorize;
  readonly sign: (key: string) => Promise<string>;
};

/** Caller settlement is separate from the pending worker's resource lifetime. */
export type RouteOperation = {
  readonly signal: AbortSignal;
  readonly status: number | undefined;
  readonly stopped: Promise<number>;
  check(): void;
  dispose(): void;
};

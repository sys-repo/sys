import type { t } from '../common.ts';

/**
 * Hash specific types.
 */
export type HashJob = {
  readonly dir: t.StringDir;
  readonly saveDist?: boolean;
};

export type HashJobCheck =
  | { readonly ok: true; readonly value: HashJob }
  | { readonly ok: false; readonly errors: readonly unknown[] };

export type HashRunParams = {
  readonly targetDir: t.StringDir;
  readonly saveDist: boolean;
};

export type HashRunResult = {
  readonly targetDir: t.StringDir;
  readonly digest: t.StringHash;
  readonly fileCount: number;
  readonly bytesTotal: t.NumberBytes;
  readonly computedAt: t.UnixTimestamp;
  readonly dist: t.DistPkg;
};

export type HashDistRowStatus = 'created' | 'changed' | 'differs' | 'invalid';

export type HashDistRow = {
  readonly path: t.StringPath;
  readonly status?: HashDistRowStatus;
};

export type HashDistRowBefore = {
  readonly path: t.StringPath;
  readonly exists: boolean;
  readonly kind: 'missing' | 'canonical' | 'legacy' | 'invalid';
  readonly digest?: t.StringHash;
};

export type HashPreflight = {
  readonly targetDir: t.StringDir;
  readonly fileCount: number;
  readonly bytesTotal: t.NumberBytes;
};

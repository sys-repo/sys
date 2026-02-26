import type { t } from '../common.ts';

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

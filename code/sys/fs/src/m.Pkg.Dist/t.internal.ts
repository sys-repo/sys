import type { t } from './common.ts';

/** Normalized producer selection policy and its descriptive digest. */
export type IgnorePolicy = {
  readonly rules: readonly string[];
  readonly digest: t.StringHash;
  readonly matcher: t.Ignore;
};

/** One admitted regular-file claim. */
export type StrictPart = {
  readonly path: t.StringRelativePath;
  readonly hash: t.StringHash;
  readonly size: t.NumberBytes;
};

/** Owned inventory and derived facts, excluding all descriptive document metadata. */
export type StrictManifest = {
  readonly content: t.DistContent;
  readonly parts: readonly StrictPart[];
  readonly totalBytes: number;
  readonly packageBytes: number;
};

/** Open-file operations used internally by Dist verification. */
export type ReadHandle = {
  readonly read: (buffer: Uint8Array) => Promise<number | null>;
  readonly stat: () => Promise<Deno.FileInfo>;
  readonly close: () => void;
};

/** Private host operations shared by local and pinned Dist verification. */
export type VerifyIo = {
  readonly lstat: (path: string) => Promise<Deno.FileInfo>;
  readonly open: (path: string) => Promise<ReadHandle>;
  readonly readDir: (path: string) => AsyncIterable<Deno.DirEntry>;
  readonly realPath: (path: string) => Promise<string>;
};

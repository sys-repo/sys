import { slug, type t, Time } from './common.ts';

/** Open-file operations used internally by Rooted. */
export type FileHandle = {
  readonly write: (data: Uint8Array) => Promise<number>;
  readonly read: (data: Uint8Array) => Promise<number | null>;
  readonly sync: () => Promise<void>;
  readonly stat: () => Promise<Deno.FileInfo>;
  readonly tryLock: (exclusive?: boolean) => Promise<boolean>;
  readonly unlock: () => Promise<void>;
  readonly close: () => void;
};

/**
 * Private host operations used by Rooted.
 * Tests replace individual methods to reproduce failures and races deterministically.
 */
export type Io = {
  readonly lstat: (path: string) => Promise<Deno.FileInfo>;
  readonly realPath: (path: string) => Promise<string>;
  readonly mkdir: (path: string, options?: Deno.MkdirOptions) => Promise<void>;
  readonly open: (path: string, options?: Deno.OpenOptions) => Promise<FileHandle>;
  readonly link: (oldpath: string, newpath: string) => Promise<void>;
  readonly rename: (oldpath: string, newpath: string) => Promise<void>;
  readonly remove: (path: string, options?: Deno.RemoveOptions) => Promise<void>;
  readonly wait: (msecs: t.Msecs, signal: AbortSignal) => Promise<void>;
  readonly token: () => string;
};

export const DEFAULT_IO: Io = Object.freeze({
  lstat: Deno.lstat,
  realPath: Deno.realPath,
  mkdir: Deno.mkdir,
  open: Deno.open,
  link: Deno.link,
  rename: Deno.rename,
  remove: Deno.remove,
  wait: (msecs, signal) => Time.wait(msecs, { signal }),
  token: slug,
});

export function withIo(overrides: Partial<Io> = {}): Io {
  return Object.freeze({ ...DEFAULT_IO, ...overrides });
}

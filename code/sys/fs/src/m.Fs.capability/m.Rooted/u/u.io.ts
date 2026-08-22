import { NodeFsConstants, openNodeFile, slug, type t, Time } from '../common.ts';

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

/** Identity and mode evidence read through one open filesystem description. */
export type ModeInfo = {
  readonly isFile: boolean;
  readonly isDirectory: boolean;
  readonly dev: number | null;
  readonly ino: number | null;
  readonly mode: number | null;
  readonly nlink: number | null;
};

/** Identity and size evidence read through a descriptor-bound readonly file. */
export type ReadInfo = ModeInfo & { readonly size: number };

/** Descriptor-bound readonly file that never follows the final path component. */
export type ReadHandle = {
  readonly read: (data: Uint8Array) => Promise<number | null>;
  readonly stat: () => Promise<ReadInfo>;
  readonly close: () => Promise<void>;
};

/** Descriptor-bound permission mutation that cannot follow a later path replacement. */
export type ModeHandle = {
  readonly stat: () => Promise<ModeInfo>;
  readonly chmod: (mode: number) => Promise<void>;
  readonly close: () => Promise<void>;
};

/**
 * Private host operations used by Rooted.
 * Tests replace individual methods to reproduce failures and races deterministically.
 */
export type Io = {
  readonly lstat: (path: string) => Promise<Deno.FileInfo>;
  readonly realPath: (path: string) => Promise<string>;
  readonly readDir: (path: string) => AsyncIterable<Deno.DirEntry>;
  readonly mkdir: (path: string, options?: Deno.MkdirOptions) => Promise<void>;
  readonly open: (path: string, options?: Deno.OpenOptions) => Promise<FileHandle>;
  readonly openRead: (path: string) => Promise<ReadHandle>;
  readonly openMode: (path: string) => Promise<ModeHandle>;
  readonly link: (oldpath: string, newpath: string) => Promise<void>;
  readonly rename: (oldpath: string, newpath: string) => Promise<void>;
  readonly remove: (path: string, options?: Deno.RemoveOptions) => Promise<void>;
  readonly wait: (msecs: t.Msecs, signal: AbortSignal) => Promise<void>;
  readonly token: () => string;
};

export const DEFAULT_IO: Io = Object.freeze({
  lstat: Deno.lstat,
  realPath: Deno.realPath,
  readDir: Deno.readDir,
  mkdir: Deno.mkdir,
  open: Deno.open,
  // Node compatibility provides atomic final-symlink refusal and non-blocking special-file opens.
  openRead: async (path) => {
    const file = await openNodeFile(
      path,
      NodeFsConstants.O_RDONLY | NodeFsConstants.O_NONBLOCK | NodeFsConstants.O_NOFOLLOW,
    );
    return {
      read: async (data) => {
        const result = await file.read(data);
        return result.bytesRead === 0 ? null : result.bytesRead;
      },
      stat: async () => {
        const info = await file.stat();
        return {
          isFile: info.isFile(),
          isDirectory: info.isDirectory(),
          dev: info.dev,
          ino: info.ino,
          mode: info.mode,
          nlink: info.nlink,
          size: info.size,
        };
      },
      close: () => file.close(),
    };
  },
  // Deno.FsFile has no descriptor chmod; Node compatibility preserves inode binding.
  openMode: async (path) => {
    const file = await openNodeFile(
      path,
      NodeFsConstants.O_RDONLY | NodeFsConstants.O_NONBLOCK,
    );
    return {
      stat: async () => {
        const info = await file.stat();
        return {
          isFile: info.isFile(),
          isDirectory: info.isDirectory(),
          dev: info.dev,
          ino: info.ino,
          mode: info.mode,
          nlink: info.nlink,
        };
      },
      chmod: (mode) => file.chmod(mode),
      close: () => file.close(),
    };
  },
  link: Deno.link,
  rename: Deno.rename,
  remove: Deno.remove,
  wait: (msecs, signal) => Time.wait(msecs, { signal }),
  token: slug,
});

export function withIo(overrides: Partial<Io> = {}): Io {
  return Object.freeze({ ...DEFAULT_IO, ...overrides });
}

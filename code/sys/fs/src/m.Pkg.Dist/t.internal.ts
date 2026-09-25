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

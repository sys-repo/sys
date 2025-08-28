import type { t } from './common.ts';

/**
 * Function signature for per-file transforms during materialize.
 */
export type FileMapProcessFile = (e: FileMapProcessEvent) => void | Promise<void>;

/**
 * Options for applying a FileMap into a target directory.
 */
export type FileMapMaterializeOptions = {
  readonly force?: boolean;
  readonly ctx?: unknown;
  readonly processFile?: t.FileMapProcessFile;
  readonly onLog?: (line: string) => void;
};

/**
 * Per-file materialization event exposed to processFile.
 */
export type FileMapProcessEvent = {
  readonly path: t.StringPath; // key from the bundle
  readonly contentType: string; // MIME derived from Data.contentType.fromUri
  readonly text?: string; // present if text/*
  readonly bytes?: Uint8Array; // present if binary
  readonly target: {
    readonly dir: t.StringDir;
    readonly absolute: t.StringPath;
    readonly relative: t.StringPath;
    exists(): Promise<boolean>;
    rename(next: string): void;
  };
  readonly ctx?: unknown;
  exclude(reason?: string): void;
  modify(next: string | Uint8Array): void;
};

/**
 * Result of materializing a FileMap into the filesystem.
 */
export type FileMapMaterializeResult = {
  readonly ops: readonly t.FileMapMaterializeOp[];
};

/**
 * Operation emitted during FileMap.materialize.
 * Keep this the single source of truth for downstream consumers.
 */
export type FileMapMaterializeOp =
  | { kind: 'write'; path: t.StringPath }
  | { kind: 'modify'; path: t.StringPath }
  | { kind: 'rename'; from: t.StringPath; to: t.StringPath }
  | { kind: 'skip'; path?: t.StringPath };

import type { t } from './common.ts';

/**
 * Materialize a FileMap into a target directory with optional per-file transforms.
 */
export type FileMapMaterialize = (
  map: t.FileMap,
  dir: t.StringDir,
  options?: t.FileMapMaterializeOptions,
) => Promise<t.FileMapMaterializeResult>;

/**
 * Function signature for per-file transforms during materialize.
 */
export type FileMapProcessor = (e: FileMapProcessEvent) => void | Promise<void>;

/**
 * Options for applying a FileMap into a target directory.
 */
export type FileMapMaterializeOptions = {
  readonly dryRun?: boolean;
  readonly force?: boolean;
  readonly ctx?: unknown;
  readonly processFile?: t.FileMapProcessor;
  readonly onLog?: (line: string) => void;
};

/**
 * Per-file materialization event exposed to processFile.
 */
export type FileMapProcessEvent = {
  readonly ctx?: unknown;
  readonly path: t.StringPath; //     ← key from the bundle
  readonly contentType: string; //    ← MIME derived from Data.contentType.fromUri
  readonly text?: string; //          ← present if text/*
  readonly bytes?: Uint8Array; //     ← present if binary
  readonly target: {
    readonly dir: t.StringDir;
    readonly absolute: t.StringPath;
    readonly relative: t.StringPath;
    exists(): Promise<boolean>;
    rename(next: string): void;
  };
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
  | ({ kind: 'write'; path: t.StringPath } & CommonOp)
  | ({ kind: 'modify'; path: t.StringPath } & CommonOp)
  | ({ kind: 'rename'; from: t.StringPath; to: t.StringPath } & CommonOp)
  | ({ kind: 'skip'; path?: t.StringPath; reason?: string } & CommonOp);

export type CommonOp = { dryRun?: boolean; forced?: boolean };

import type { t } from './common.ts';

/**
 * Materialize a FileMap into a target directory with optional per-file transforms.
 */
export type FileMapWrite = (
  map: t.FileMap,
  dir: t.StringDir,
  options?: t.FileMapWriteOptions,
) => Promise<t.FileMapWriteResult>;

/**
 * Function signature for per-file transforms during materialize.
 */
export type FileMapProcessor = (e: FileMapProcessorArgs) => void | Promise<void>;
/** Per-file process callback exposed via `processFile` callback. */
export type FileMapProcessorArgs = {
  readonly ctx?: unknown;
  readonly path: t.StringPath; //     ← key from the bundle
  readonly contentType: string; //    ← MIME derived from Data.contentType.fromUri
  readonly text?: string; //          ← present if text/*
  readonly bytes?: Uint8Array; //     ← present if binary
  readonly target: {
    readonly dir: t.StringDir;
    readonly absolute: t.StringPath;
    readonly relative: t.StringPath;
    readonly filename: t.StringName;
    exists(): Promise<boolean>;
    rename(next: string): void;
  };
  exclude(reason?: string): void;
  modify(next: string | Uint8Array): void;
};

/**
 * Options for applying a FileMap into a target directory.
 */
export type FileMapWriteOptions = {
  readonly dryRun?: boolean;
  readonly force?: boolean;
  readonly ctx?: unknown;
  readonly processFile?: t.FileMapProcessor;
};

/**
 * Result of materializing a FileMap into the filesystem.
 */
export type FileMapWriteResult = {
  readonly ops: readonly t.FileMapOp[];
  readonly total: { readonly [K in t.FileMapOp['kind']]: number };
};

/**
 * Operation emitted during FileMap.materialize.
 * Keep this the single source of truth for downstream consumers.
 */
export type FileMapOp =
  | ({ kind: 'create'; path: t.StringPath; renamed?: FileMapOpRenamed } & FileMapOpCommon)
  | ({ kind: 'modify'; path: t.StringPath; renamed?: FileMapOpRenamed } & FileMapOpCommon)
  | ({ kind: 'skip'; path: t.StringPath; reason?: string } & FileMapOpCommon);
export type FileMapOpCommon = { dryRun?: boolean; forced?: boolean };

/** Meta-data added to a write operation when the file was renamed */
export type FileMapOpRenamed = { from: t.StringPath };

/**
 * Utility: Pick out ops from FileMapMaterializeOp whose `kind` matches K.
 */
export type OpOfKind<K extends FileMapOp['kind']> = Extract<FileMapOp, { kind: K }>;

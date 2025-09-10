import type { t } from './common.ts';

/** Options passed to `Obj.Path.diff` method. */
export type ObjDiffOptions = { diffArrays?: boolean };

/**
 * A JSON-serialisable description of one structural change.
 */
export type ObjDiffOp =
  | { type: 'add'; path: t.ObjectPath; value: unknown } //                        ← key existed only in → source
  | { type: 'remove'; path: t.ObjectPath; prev: unknown } //                      ← key existed only in → target
  | { type: 'update'; path: t.ObjectPath; prev: unknown; next: unknown } //       ← primitive / object leaf changed
  | { type: 'array'; path: t.ObjectPath; prev: unknown[]; next: unknown[] }; //   ← whole array replaced

/**
 * Aggregate result returned `Obj.diff`.
 */
export type ObjDiffReport = {
  /** Ordered list of operations in the sequence they were applied. */
  readonly ops: ObjDiffOp[];
  /** Summary stats of operations: */
  readonly stats: {
    readonly adds: number;
    readonly removes: number;
    readonly updates: number;
    readonly arrays: number;
    readonly total: number;
  };
};

import type { t } from '../common.ts';

/** Schema library for slug media compositions. */
export type SlugMediaCompositionSchemaLib = {
  /** Sequence authoring schema (guards + validation). */
  readonly Sequence: t.SlugSequenceSchemaLib;
};

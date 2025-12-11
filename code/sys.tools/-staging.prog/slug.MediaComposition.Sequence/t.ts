import type { t } from '../common.ts';

/** Type exports */
export type * from './t.seq.ts';
export type * from './t.normalize.ts';

/**
 * Authoring-time pipeline:
 *   YAML → sequence union → validated → normalized.
 */
export type SequenceLib = {
  readonly Is: SequenceIsLib;
  readonly Normalize: t.SequenceNormalizeLib;

  /**
   * Structural validation of an authoring-time sequence.
   */
  validate(input: unknown): t.ValidateResult<t.SequenceItem[]>;

  /**
   * Extract a sequence from a CRDT DAG at a given YAML path.
   * Optionally validates the result.
   */
  fromDag(
    dag: t.Graph.Dag.Result,
    yamlPath: t.ObjectPath,
    docid: t.Crdt.Id,
    opts?: { validate?: boolean },
  ): Promise<t.ValidateResult<t.SequenceItem[]>>;
};

/**
 * Type guards.
 */
export type SequenceIsLib = {
  /**
   * Cheap structural guard that ensures the item
   * looks like one of the known sequence shapes
   * (but not actually schema validated).
   */
  itemLike(value: unknown): value is t.SequenceItem;
};

/**
 * Slug-specific projection from the authoring-time slug sequence
 * into the generic timecode composition model.
 */
export type SequenceNormalizeLib = {
  /** Normalized result of lowering the YAML DSL to a timecode `Sequence`. */
  toTimecode(
    sequence: t.SequenceItem[],
    opts?: { docid?: t.Crdt.Id; yamlPath?: t.ObjectPath },
  ): t.SequenceNormalized;
};

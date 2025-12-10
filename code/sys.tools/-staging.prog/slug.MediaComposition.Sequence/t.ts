import type { t } from '../common.ts';

/** Type exports */
export type * from './t.seq.ts';
export type * from './t.normalize.ts';

type Dag = t.Graph.Dag.Result;

/**
 * Authoring-time pipeline:
 *   YAML → sequence union → validated → normalized.
 */
export type SlugSequenceLib = {
  readonly Is: SlugSequenceIsLib;
  readonly Normalize: t.SlugSequenceNormalizeLib;

  /**
   * Structural validation of an authoring-time sequence.
   */
  validate(input: unknown): t.ValidateResult<t.SlugSequence>;

  /**
   * Extract a sequence from a CRDT DAG at a given YAML path.
   * Optionally validates the result.
   */
  fromDag(
    dag: Dag,
    yamlPath: t.ObjectPath,
    docid: t.Crdt.Id,
    opts?: SlugSequenceFromDagOptions,
  ): Promise<t.SlugSequence | undefined>;

  /**
   * Load + normalize a sequence into a playback-ready spec.
   * Used when generating `slug.<docid>.playback.json`.
   */
  toPlaybackSpec(
    dag: Dag,
    yamlPath: t.ObjectPath,
    docid: t.Crdt.Id,
    opts?: SlugSequenceFromDagOptions,
  ): Promise<t.SlugPlaybackSpec | undefined>;
};
/**
 * Type guards.
 */
export type SlugSequenceIsLib = {
  /**
   * Cheap structural guard that ensures the item
   * looks like one of the known sequence shapes
   * (but not actually schema validated).
   */
  itemLike(value: unknown): value is t.SlugSequenceItem;
};

/**
 * Slug-specific projection from the authoring-time slug sequence
 * into the generic timecode composition model.
 */
export type SlugSequenceNormalizeLib = {
  /** Normalized result of lowering the YAML DSL to a timecode `Sequence`. */
  toTimecode(
    sequence: t.SlugSequence,
    opts?: { docid?: t.Crdt.Id; yamlPath?: t.ObjectPath },
  ): t.SlugSequenceNormalized;
};

/** Options for `Sequence.fromDag` method */
export type SlugSequenceFromDagOptions = { readonly validate?: boolean };

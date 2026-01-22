import type { t } from '../common.ts';

/**
 * Normalization helpers for compiler-side sequence processing.
 */
export type SlugSequenceNormalizeLib = {
  /** Normalized result of lowering the YAML DSL to a timecode `Sequence`. */
  toTimecode(
    sequence: t.SequenceItem[],
    opts?: { docid?: t.Crdt.Id; yamlPath?: t.ObjectPath },
  ): t.SequenceNormalized;
};

/**
 * Compiler-facing sequence utilities.
 */
export type SlugSequenceLib = {
  readonly Is: t.SlugSequenceIsLib;
  readonly Normalize: SlugSequenceNormalizeLib;

  /**
   * Structural validation of an authoring-time sequence.
   */
  validate(input: unknown): t.SlugValidateResult<t.SequenceItem[]>;

  /**
   * Extract a sequence from a CRDT DAG at a given YAML path.
   * Optionally validates the result.
   */
  fromDag(
    dag: t.Graph.Dag.Result,
    yamlPath: t.ObjectPath,
    docid: t.Crdt.Id,
    opts?: { validate?: boolean; trait?: t.SlugTraitGateOptions | null },
  ): Promise<t.SlugValidateResult<t.SequenceItem[]>>;
};

import type { t } from '../common.ts';

export type * from './t.seq.ts';

type Dag = t.Graph.Dag.Result;
type O = Record<string, unknown>;

/**
 * Slug sequence tools.
 */
export type SequenceLib = {
  readonly Is: SequenceIsLib;
  validate(input: unknown): t.ValidateResult<t.Sequence>;
  fromDag(
    dag: Dag,
    yamlPath: t.ObjectPath,
    docid: t.Crdt.Id,
    opts?: SequenceFromDagOptions,
  ): Promise<t.Sequence | undefined>;
};

/** Options for `Sequence.fromDag` method */
export type SequenceFromDagOptions = { readonly validate?: boolean };

/**
 * Type guards.
 */
export type SequenceIsLib = {
  /**
   * Cheap structural guard that ensures the item
   * looks like one of the known sequence shapes (not actually validated).
   */
  itemLike(value: unknown): value is t.SequenceItem;
};

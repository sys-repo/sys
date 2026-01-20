import type { t } from './common.ts';

export type SlugTreeLib = {
  Schema: t.SlugTreeSchemaLib;
  fromDag: t.SlugTreeFromDag;
};

export type SlugTreeFromDag = (
  dag: t.Graph.Dag.Result,
  yamlPath: t.ObjectPath,
  docid: t.Crdt.Id,
  opts?: t.SlugTreeFromDagOpts,
) => Promise<t.ValidateResult<t.SlugTreeItems>>;
export type SlugTreeFromDagOpts = {
  readonly validate?: boolean;
  readonly trait?: t.SlugTraitGateOptions | null;
  readonly registry?: t.SlugTraitRegistry;
};

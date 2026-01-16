import type { t } from './common.ts';

export type SlugTreeItemRefOnly = {
  readonly slug: string;
  readonly ref: string;
  readonly slugs?: readonly SlugTreeItem[];
};

export type SlugTreeItemInline = {
  readonly slug: string;
  readonly description?: string;
  readonly traits?: readonly t.SlugTrait[];
  readonly data?: { readonly [key: string]: unknown };
  readonly slugs?: readonly SlugTreeItem[];
};

export type SlugTreeItem = SlugTreeItemRefOnly | SlugTreeItemInline;
export type SlugTreeProps = readonly SlugTreeItem[];

export type SlugTraitRegistryEntry = {
  readonly id: string;
  readonly propsSchema: t.TSchema;
};

export type SlugTraitRegistry = {
  readonly all: readonly SlugTraitRegistryEntry[];
  get(id: string): SlugTraitRegistryEntry | undefined;
};

export type SlugTreeValidateOpts = {
  readonly registry?: SlugTraitRegistry;
};

export type SlugTreeFromDagOpts = {
  readonly validate?: boolean;
  readonly trait?: t.SlugTraitGateOptions | null;
  readonly registry?: SlugTraitRegistry;
};

export type SlugTreeLib = {
  readonly Schema: {
    readonly Item: t.TSchema;
    readonly Props: t.TSchema;
  };
  readonly validate: (
    input: unknown,
    opts?: SlugTreeValidateOpts,
  ) => t.ValidateResult<SlugTreeProps>;
  readonly fromDag: (
    dag: t.Graph.Dag.Result,
    yamlPath: t.ObjectPath,
    docid: t.Crdt.Id,
    opts?: SlugTreeFromDagOpts,
  ) => Promise<t.ValidateResult<SlugTreeProps>>;
};

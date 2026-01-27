import type { t } from './common.ts';

/** Slug-tree helpers. */
export type SlugTreeLib = {
  Schema: t.SlugTreeSchemaLib;
  fromDag: t.SlugTreeFromDag;
  fromDir: t.SlugTreeFromDir;
  reindex: t.SlugTreeReindex;
  toYaml: t.SlugTreeToYaml;
};

/** Build a slug-tree from a DAG document. */
export type SlugTreeFromDag = (
  dag: t.Graph.Dag.Result,
  yamlPath: t.ObjectPath,
  docid: t.Crdt.Id,
  opts?: t.SlugTreeFromDagOpts,
) => Promise<t.SlugValidateResult<t.SlugTreeItems>>;
/** Options for DAG-based slug-tree extraction. */
export type SlugTreeFromDagOpts = {
  validate?: boolean;
  trait?: t.SlugTraitGateOptions | null;
  registry?: t.SlugTraitRegistry;
};

/** Build a slug-tree from a directory, ensuring CRDT refs in front-matter. */
export type SlugTreeFromDir = (args: {
  root: t.StringDir;
  createCrdt: () => Promise<t.StringRef>;
  opts?: SlugTreeFromDirOpts;
}) => Promise<t.SlugTreeItems>;

/** Options for directory-based slug-tree creation. */
export type SlugTreeFromDirOpts = {
  include?: readonly string[];
  ignore?: readonly string[];
  sort?: boolean;
  readmeAsIndex?: boolean;
};

/** Reindex a slug-tree using an ordering model from a prior tree. */
export type SlugTreeReindex = (args: {
  prev: t.SlugTreeItems;
  next: t.SlugTreeItems;
  opts?: SlugTreeReindexOpts;
}) => t.SlugTreeItems;

/** Reindex key strategy. */
export type SlugTreeReindexKey = 'auto' | 'ref' | 'slug';

/** Options for slug-tree reindexing. */
export type SlugTreeReindexOpts = {
  key?: SlugTreeReindexKey;
};

/** Serialize a slug-tree to YAML. */
export type SlugTreeToYaml = (tree: t.SlugTreeItems) => string;

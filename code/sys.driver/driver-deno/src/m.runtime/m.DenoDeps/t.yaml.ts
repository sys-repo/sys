import type { t } from './common.ts';

/**
 * Structure of the YAML definition file.
 */
export type YamlDeps = {
  /** Reusable named dependency groups. */
  groups?: t.YamlDepsGroups;
  /** Dependency entries that target `deno.json`. */
  'deno.json'?: t.YamlDep[];
  /** Dependency entries that target `package.json`. */
  'package.json'?: t.YamlDep[];
};

/**
 * Named groups of imports.
 */
export type YamlDepsGroupName = string;
/** Map of group names to reusable dependency entries. */
export type YamlDepsGroups = { [groupname: t.YamlDepsGroupName]: t.YamlDepsGroup[] };
/** Reusable YAML dependency entry stored under a group. */
export type YamlDepsGroup = Omit<t.YamlDep, 'group'>;

/**
 * Represents a module dependency of the workspace.
 */
export type YamlDep = {
  /**
   * The name (module-specifier) of an ESM import.
   * eg:
   *    jsr:@sys/tmp@0.0.0
   *    npm:rxjs@7
   */
  import?: t.StringModuleSpecifier;

  /** Name of an import group to include. */
  group?: t.YamlDepsGroupName;

  /** Array of sub-paths for the module. */
  subpaths?: t.StringDir[];

  /** Override name to use if differnt from the `import` module-name. */
  name?: string;

  /**
   * Flag indicating if the import is a development-dependency only.
   * Only relevant when producing a `package.json` file.
   */
  dev?: boolean;
};

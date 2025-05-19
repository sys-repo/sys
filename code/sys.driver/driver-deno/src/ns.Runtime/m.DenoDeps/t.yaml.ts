import type { t } from './common.ts';

/**
 * Structure of the YAML definition file.
 */
export type YamlDeps = {
  groups?: t.YamlDepsGroups;
  'deno.json'?: t.YamlDep[];
  'package.json'?: t.YamlDep[];
};

/**
 * Named groups of imports.
 */
export type YamlDepsGroupName = string;
export type YamlDepsGroups = { [groupname: t.YamlDepsGroupName]: t.YamlDepsGroup[] };
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

  /** Flag indicating if a wildcard entry should be inserted into an generated import-map. */
  wildcard?: boolean;

  /** Array of sub-paths for the module. */
  subpaths?: t.StringDir[];

  /**
   * Flag indicating if the import is a development-dependency only.
   * Only relevant when producing a `package.json` file.
   */
  dev?: boolean;
};

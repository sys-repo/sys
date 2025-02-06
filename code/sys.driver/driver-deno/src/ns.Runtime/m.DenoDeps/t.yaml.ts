import type { t } from './common.ts';

/**
 * Structure of the YAML definition file.
 */
export type DenoYamlDeps = {
  groups?: t.DenoYamlDepsGroups;
  'deno.json'?: t.DenoYamlDep[];
  'package.json'?: t.DenoYamlDep[];
};

/**
 * Named groups of imports.
 */
export type DenoYamlGroupName = string;
export type DenoYamlDepsGroups = { [groupname: t.DenoYamlGroupName]: t.DenoYamlDepsGroup[] };
export type DenoYamlDepsGroup = Omit<t.DenoYamlDep, 'group'>;

export type DenoYamlDep = {
  /**
   * The name (module-specifier) of an ESM import.
   * eg:
   *    jsr:@sys/tmp@0.0.0
   *    npm:rxjs@7
   */
  import: t.StringModuleSpecifier;

  /** Name of an import group to include. */
  group: t.DenoYamlGroupName;

  /** Flag indicating if a wildcard entry should be inserted into an generated import-map. */
  wildcard?: boolean;

  /**
   * Flag indicating if the import is a development-dependency only.
   * Only relevant when producing a `package.json` file.
   */
  dev?: boolean;
};

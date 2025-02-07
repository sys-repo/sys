import type { t } from './common.ts';

/**
 * Structure of the YAML definition file.
 */
export type YamlDenoDeps = {
  groups?: t.YamlDenoDepsGroups;
  'deno.json'?: t.YamlDenoDep[];
  'package.json'?: t.YamlDenoDep[];
};

/**
 * Named groups of imports.
 */
export type YamlDenoGroupName = string;
export type YamlDenoDepsGroups = { [groupname: t.YamlDenoGroupName]: t.YamlDenoDepsGroup[] };
export type YamlDenoDepsGroup = Omit<t.YamlDenoDep, 'group'>;

/**
 * Represents a module dependency of the workspace.
 */
export type YamlDenoDep = {
  /**
   * The name (module-specifier) of an ESM import.
   * eg:
   *    jsr:@sys/tmp@0.0.0
   *    npm:rxjs@7
   */
  import?: t.StringModuleSpecifier;

  /** Name of an import group to include. */
  group?: t.YamlDenoGroupName;

  /** Flag indicating if a wildcard entry should be inserted into an generated import-map. */
  wildcard?: boolean;

  /**
   * Flag indicating if the import is a development-dependency only.
   * Only relevant when producing a `package.json` file.
   */
  dev?: boolean;
};

import { type t } from './common.ts';

/**
 * Tools for working with the config filename(s).
 */
export type YamlConfigFileLib = {
  /**
   * Create a config file root from a base dir + basename.
   */
  readonly create: (args: { dir: t.StringDir; basename: t.StringName }) => YamlConfigFile;
  /**
   * Create a config file root for a package name (flattened).
   */
  readonly fromPkg: (pkg: t.Pkg) => YamlConfigFile;
};

/**
 * Root naming structure for a YAML config file group.
 */
export type YamlConfigFile = {
  readonly dir: { readonly name: string; path: t.StringDir };
};

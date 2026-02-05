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
  readonly fromPkg: (dir: t.StringDir, pkg: t.Pkg) => YamlConfigFile;
  /**
   * Move YAML files from one dir to another (best-effort).
   */
  readonly migrateDir: (args: {
    cwd: t.StringDir;
    from: t.StringPath;
    to: t.StringPath;
    ext?: t.StringPath;
  }) => Promise<YamlConfigFileMigrateDirResult>;
};

export type YamlConfigFileMigrateDirResult = {
  readonly migrated: ReadonlyArray<{ readonly from: t.StringPath; readonly to: t.StringPath }>;
  readonly skipped: ReadonlyArray<{ readonly from: t.StringPath; readonly to: t.StringPath }>;
};

/**
 * Root naming structure for a YAML config file group.
 */
export type YamlConfigFile = {
  readonly dir: { readonly name: string; path: t.StringDir };
};

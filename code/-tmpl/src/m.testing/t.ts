import type { t } from './common.ts';

/**
 * Testing helpers for local-workspace generated tmpl repos/packages.
 */
export declare namespace TmplTesting {
  /** Public testing helper surface. */
  export type Lib = {
    readonly LocalRepoAuthorities: LocalRepoAuthoritiesLib;
    readonly LocalRepoFixture: LocalRepoFixtureLib;
  };

  /**
   * Operations over localized repo authority files.
   * "Authority" here means the generated repo files that act as the
   * dependency-resolution authority in local-workspace test mode.
   */
  export type LocalRepoAuthoritiesLib = {
    /** Rewrite an already-generated repo fixture into local-workspace authority truth. */
    rewrite(args: LocalRepoAuthoritiesRewriteArgs): Promise<LocalRepoAuthorities>;

    /** Read the currently materialized authority files from a generated repo fixture. */
    read(root: t.StringAbsoluteDir): Promise<LocalRepoAuthorities>;
  };

  /** Operations for creating localized repo fixtures for tests. */
  export type LocalRepoFixtureLib = {
    /** Convenience creation of a localized repo fixture for common test flows. */
    create(args?: LocalRepoFixtureCreateArgs): Promise<LocalRepoFixture>;
  };

  /**
   * Local-workspace authority files materialized into a generated repo fixture.
   * Specifically, the generated repo `imports.json` and `package.json` after
   * localization against current @sys workspace truth.
   */
  export type LocalRepoAuthorities = {
    readonly imports: Record<string, string>;
    readonly packageJson: {
      readonly dependencies?: Record<string, string>;
      readonly devDependencies?: Record<string, string>;
    };
  };

  /** A generated repo fixture localized against current @sys workspace truth. */
  export type LocalRepoFixture = {
    readonly root: t.StringAbsoluteDir;
    readonly authorities: LocalRepoAuthorities;
  };

  /** Rewrite an already-generated repo fixture to local-workspace authority truth. */
  export type LocalRepoAuthoritiesRewriteArgs = {
    readonly root: t.StringAbsoluteDir;

    /**
     * Optional explicit workspace authority root.
     * Defaults to nearest detected @sys monorepo root.
     */
    readonly workspaceRoot?: t.StringAbsoluteDir;
  };

  /** Convenience creation of a localized repo fixture for common test flows. */
  export type LocalRepoFixtureCreateArgs = {
    readonly cwd?: t.StringDir;
    readonly targetDir?: t.StringDir;
    readonly force?: boolean;
    readonly dryRun?: boolean;
    /** Suppress repo-generation output while materializing the fixture. */
    readonly silent?: boolean;
  };
}

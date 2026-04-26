import type { t } from '../common.ts';

/**
 * Internal pass-through delegation contract for thin `@sys/tools/*` wrappers.
 *
 * Extraction intent:
 * - keep wrapper-specific command/env concerns outside this type layer
 * - make local-vs-published delegation context explicit and root-testable
 * - allow one small context resolver to serve multiple wrapper entrypoints
 *
 * Initial sample callers:
 * - `src/cli.pi/mod.ts`
 * - `src/cli.tmpl/mod.ts`
 */

/** Workspace child evidence used to prove repo shape. */
export type PassThroughWorkspaceChild = {
  readonly pkg: { readonly name: string };
  readonly path: { readonly dir: t.StringDir };
};

/** Minimal workspace shape needed by the delegation resolver. */
export type PassThroughWorkspaceInfo = {
  readonly exists: boolean;
  readonly dir: t.StringDir;
  readonly file: t.StringPath;
  readonly children: readonly PassThroughWorkspaceChild[];
};

/**
 * Canonical repo-shape contract that grants local delegation privilege.
 *
 * This is intentionally structural rather than tool-specific:
 * - root directory basename must match
 * - workspace config file must be one of the allowed names
 * - required package names must exist
 * - required workspace child dirs must exist
 */
export type PassThroughRepoShape = {
  readonly rootDirname?: string;
  readonly configFilenames?: readonly string[];
  readonly requiredPackages: readonly string[];
  readonly requiredDirs: readonly string[];
};

/**
 * Delegation target contract for one thin wrapper.
 *
 * - `localSpecifier` is the monorepo-local target used only when repo-shape
 *   proof says local privilege is truthful.
 * - `publishedSpecifier` is the deterministic external fallback.
 */
export type PassThroughTarget = {
  readonly localSpecifier: string;
  readonly publishedSpecifier: string;
  readonly repo: PassThroughRepoShape;
};

/** Why a delegation decision resolved the way it did. */
export type PassThroughReason =
  | 'system-workspace'
  | 'workspace-mismatch'
  | 'no-workspace';

/** Selected delegation mode. */
export type PassThroughMode = 'local' | 'published';

/**
 * Root-testable delegation context.
 *
 * This is the intended output of the future shared context resolver.
 * It captures just enough truth for:
 * - deciding local vs published delegation
 * - proving why that decision was made
 * - later assembling wrapper-specific command/env plans separately
 */
export type PassThroughContext = {
  readonly cwd: t.StringDir;
  readonly mode: PassThroughMode;
  readonly reason: PassThroughReason;
  readonly specifier: string;
  readonly target: PassThroughTarget;
  readonly workspace?: {
    readonly dir: t.StringDir;
    readonly file: t.StringPath;
  };
};

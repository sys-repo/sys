import type { t } from './common.ts';
import type { DenoDeploy } from './t.ts';

/**
 * Ownership model for the staging root: `temp` is driver-owned, `path` is caller-owned.
 */
export type Root =
  /** Driver-owned temporary staging root. */
  | { readonly kind: 'temp' }
  /** Caller-owned staging root path. */
  | { readonly kind: 'path'; readonly dir: t.StringDir };

/**
 * Request to stage and build a selected workspace target.
 */
export type Request = {
  /** Workspace target to materialize for deployment. */
  readonly target: DenoDeploy.Target;

  /** Optional staging root policy; when omitted, the driver chooses the default strategy. */
  readonly root?: Root;
};

/**
 * Resolved staged artifact bridging workspace resolution to downstream deploy.
 */
export type Result = {
  /** Target that was selected for staging. */
  readonly target: DenoDeploy.Target;

  /** Resolved workspace context used during staging. */
  readonly workspace: t.DenoWorkspace;

  /** Root directory of the staged deployable artifact. */
  readonly root: t.StringDir;

  /** Deploy entry path inside the staged root. */
  readonly entry: t.StringPath;
};

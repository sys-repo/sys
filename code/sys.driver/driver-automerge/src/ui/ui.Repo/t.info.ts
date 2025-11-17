import { type t } from './common.ts';

/**
 * Read-only CRDT repo status panel.
 *
 * Renders high-level diagnostics for a `Crdt.Repo`: readiness, instance/peer
 * IDs, active network endpoints, connection state, and local storage backend.
 */
export type RepoInfoProps = {
  repo?: t.Crdt.Repo;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Small indicator dot showing the repo's current connectivity state.
 *
 * - Green (selected) when the repo is online.
 * - Dim/neutral when offline or no status available.
 *
 * Accepts an explicit `status` or derives it from the given `repo`.
 */
export type RepoStatusBulletProps = {
  repo?: t.Crdt.Repo;
  status?: t.RepoInfoStatus;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

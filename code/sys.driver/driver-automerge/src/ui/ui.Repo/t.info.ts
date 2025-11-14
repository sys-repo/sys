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

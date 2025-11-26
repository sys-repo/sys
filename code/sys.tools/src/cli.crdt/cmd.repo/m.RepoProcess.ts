import { client, tryClient } from './u.client.ts';
import { daemon } from './u.daemon.ts';

export const RepoProcess = {
  /**
   * Runs the CRDT repo as a long-lived daemon rendering a live terminal UI.
   */
  daemon,

  /**
   * Connects to the repository daemon and returns a typed command client.
   */
  client,
  tryClient,
} as const;

import { type t } from './common.ts';

/**
 * API for working with the stack of players.
 */
export type PlayerStackLib = {
  /** Lookup the player on the stack */
  find(
    app: t.AppSignals,
    layer: t.StringId | t.Content,
    index: number,
  ): t.VideoPlayerSignals | undefined;
};

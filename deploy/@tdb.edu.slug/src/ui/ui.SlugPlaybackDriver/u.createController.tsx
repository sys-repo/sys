import { type t, Player, Rx, slug } from '../common.ts';

/**
 * SlugPlaybackController factory that creates elegant bridge between TreeHost selection
 * and PlaybackDriver component injection into the aux slot.
 */
export const createController: t.SlugPlaybackControllerLib['create'] = (args = {}) => {
  const id = `slugplayback-${slug()}`;

  let currentDriver: t.DisposableLike | undefined;

  const controller = Rx.toLifecycle<t.SlugPlaybackController>({
    id,
    props() {
      return args.props?.() ?? {};
    },
  });

  return controller;
};

/**
 * Create minimal video decks for PlaybackDriver.
 */
function createDecks() {
  return { A: createVideo(), B: createVideo() };
}
function createVideo() {
  Player.Video.signals({ cornerRadius: 4, showControls: false, muted: true });
}

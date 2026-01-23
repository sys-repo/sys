import { type t, Rx, slug } from '../common.ts';

/**
 * SlugPlaybackController factory that creates elegant bridge between TreeHost selection
 * and PlaybackDriver component injection into the aux slot.
 */
export const createController: t.SlugPlaybackControllerLib['create'] = (args = {}) => {
  const id = `slugplayback-${slug()}`;
  let rev = 0;

  const life = Rx.lifecycle();
  let state: t.SlugPlaybackControllerState = {};

  const controller = Rx.toLifecycle<t.SlugPlaybackController>({
    id,
    get rev() {
      return rev;
    },
    props() {
      return args.props?.() ?? {};
    },
    state() {
      return state;
    },
    next(patch: t.SlugPlaybackControllerPatch = {}) {
      if (life.disposed) return;

      let changed = false;
      let nextState: t.SlugPlaybackControllerState = state;

      if (patch.selectedPath !== undefined && patch.selectedPath !== state.selectedPath) {
        nextState = { ...nextState, selectedPath: patch.selectedPath };
        changed = true;
      }

      if (patch.tree !== undefined && patch.tree !== state.tree) {
        nextState = { ...nextState, tree: patch.tree };
        changed = true;
      }

      if (!changed) return;

      state = nextState;
      rev += 1;
    },
  });

  return controller;
};

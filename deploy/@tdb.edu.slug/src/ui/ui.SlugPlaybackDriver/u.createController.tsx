import { type t, Player, Rx, slug, Immutable } from '../common.ts';

/**
 * SlugPlaybackController factory that creates elegant bridge between TreeHost selection
 * and PlaybackDriver component injection into the aux slot.
 */
export const createController: t.SlugPlaybackControllerLib['create'] = (args = {}) => {
  const id = `slugplayback-${slug()}`;
  let rev = 0;

  const state = Immutable.clonerRef<t.SlugPlaybackControllerNext>({});
  const controller = Rx.toLifecycle<t.SlugPlaybackController>({
    id,
    get rev() {
      return rev;
    },
    props() {
      return args.props?.() ?? {};
    },
    next(e = {}) {
      state.change((d) => {
        if (e.selectedPath != null) d.selectedPath = e.selectedPath;
        if (e.tree != null) d.tree = e.tree;
      });
    },
  });

  state.events(controller.dispose$).$.subscribe(() => (rev += 1));
  return controller;
};

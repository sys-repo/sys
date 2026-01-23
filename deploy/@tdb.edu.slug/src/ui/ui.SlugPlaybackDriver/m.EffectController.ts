import { type t, Immutable, Rx, slug } from '../common.ts';
import { attachSlugLoaderEffect } from './u.attachSlugLoaderEffect.ts';

type State = t.SlugPlaybackState;
type Patch = t.SlugPlaybackPatch;
type Controller = t.SlugPlaybackController;
type ChangeHandler = t.EffectControllerChangeHandler<State>;

type M = t.SlugPlaybackControllerLib;

/**
 * Create a SlugPlaybackController.
 */
const create: M['create'] = (args) => {
  const controller = createKernel();

  // Wire effects.
  attachSlugLoaderEffect(controller, { baseUrl: args.baseUrl });

  return controller;
};

/**
 * Pure EffectController kernel.
 * Owns: lifecycle, state, rev, next, onChange.
 * Does no domain work.
 */
function createKernel(): Controller {
  const id = `slug-playback-${slug()}`;
  const life = Rx.lifecycle();
  const state = Immutable.clonerRef<State>({});
  const events = state.events(life.dispose$);
  const listeners = new Set<ChangeHandler>();

  let _rev = 0;

  // Notify listeners on state change.
  events.$.subscribe(({ after }) => {
    _rev += 1;
    listeners.forEach((fn) => fn(after));
  });

  const controller = Rx.toLifecycle<Controller>(life, {
    id,
    get rev() {
      return _rev;
    },

    current() {
      return state.current;
    },

    next(patch: Patch = {}) {
      if (life.disposed) return;
      state.change((d) => Object.assign(d, patch));
    },

    onChange(fn) {
      if (life.disposed) return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  });

  life.dispose$.subscribe(() => listeners.clear());

  return controller;
}

/**
 * Factory for SlugPlaybackController.
 */
export const EffectController: M = { create } as const;

import { type t, Rx, slug } from '../common.ts';
import { attachSlugLoaderEffect } from './u.attachSlugLoaderEffect.ts';

type State = t.SlugPlaybackState;
type Patch = t.SlugPlaybackPatch;
type Controller = t.SlugPlaybackController;
type ChangeHandler = t.EffectControllerChangeHandler<State>;

// type CreateArgs = { baseUrl: t.StringUrl };

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
  const listeners = new Set<ChangeHandler>();

  let _rev = 0;
  let _state: State = {};

  const notify = () => {
    const state = _state;
    listeners.forEach((fn) => fn(state));
  };

  const controller = Rx.toLifecycle<Controller>(life, {
    id,
    get rev() {
      return _rev;
    },

    current() {
      return _state;
    },

    next(patch: Patch = {}) {
      if (life.disposed) return;

      const next = { ..._state, ...patch };
      if (shallowEqual(_state, next)) return;

      _state = next;
      _rev += 1;
      notify();
    },

    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  });

  life.dispose$.subscribe(() => {
    listeners.clear();
  });

  return controller;
}

/**
 * Shallow compare top-level keys by reference (Object.is).
 */
function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  const keysA = Object.keys(a) as (keyof T)[];
  const keysB = Object.keys(b) as (keyof T)[];
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (!Object.is(a[k], b[k])) return false;
  }
  return true;
}

/**
 * Factory for SlugPlaybackController.
 */
export const EffectController: M = { create } as const;

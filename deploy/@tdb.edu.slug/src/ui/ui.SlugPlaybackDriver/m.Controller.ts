import { EffectController as StdEffectController } from '@sys/std/effect';
import { type t, Immutable, slug } from '../common.ts';
import { attachSlugLoaderEffect } from './u.attachSlugLoaderEffect.ts';

type State = t.SlugPlaybackState;
type Patch = t.SlugPlaybackPatch;

/**
 * Factory for SlugPlaybackController.
 */
export const Controller: t.SlugPlaybackControllerLib = {
  create(args) {
    const { baseUrl } = args;
    const id = `slug-playback-${slug()}`;
    const ref = Immutable.clonerRef<State>({});
    const controller = StdEffectController.create<State, Patch>({ id, ref });

    // Wire effects.
    attachSlugLoaderEffect(controller, { baseUrl });

    return controller;
  },
};

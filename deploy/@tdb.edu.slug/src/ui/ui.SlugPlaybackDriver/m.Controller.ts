import { type t, EffectController, Immutable, slug } from '../common.ts';
import { attachPlaybackDriverEffect, attachSlugLoaderEffect } from '../m.effects/mod.ts';

type State = t.SlugPlaybackState;

/**
 * SlugPlaybackController factory.
 */
export const Controller: t.SlugPlaybackControllerLib = {
  create(props) {
    const id = `slug-playback-${slug()}`;
    const ref = Immutable.clonerRef<State>({});
    const controller = EffectController.create({ id, ref, props });

    // Wire effects.
    attachSlugLoaderEffect(controller, {});
    attachPlaybackDriverEffect(controller);

    return controller;
  },
};

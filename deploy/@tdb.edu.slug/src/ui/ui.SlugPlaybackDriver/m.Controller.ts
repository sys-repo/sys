import { type t, EffectController, Immutable, slug } from '../common.ts';
import { attachPlaybackDriverEffect, attachSlugLoaderEffect } from '../m.effects/mod.ts';
import { makePlaybackAdapter } from './u.effect.playback.ts';
import { makeSlugAdapter } from './u.effect.slug.ts';

type State = t.SlugPlaybackState;

/**
 * SlugPlaybackController factory.
 */
export const Controller: t.SlugPlaybackControllerLib = {
  create(props) {
    const id = `slug-playback-${slug()}`;
    const ref = Immutable.clonerRef<State>({});
    const controller = EffectController.create({ id, ref, props });

    const setBundle = (bundle: t.TimecodePlaybackDriver.Wire.Bundle | undefined) => {
      const playback = { ...(controller.current().playback ?? {}), bundle };
      controller.next({ playback });
    };

    // Wire effects.
    const playbackAdapter = makePlaybackAdapter(controller);
    const slugAdapter = makeSlugAdapter(controller);

    attachSlugLoaderEffect(slugAdapter, { baseUrl: props.baseUrl, setBundle });
    attachPlaybackDriverEffect(playbackAdapter);

    return controller;
  },
};

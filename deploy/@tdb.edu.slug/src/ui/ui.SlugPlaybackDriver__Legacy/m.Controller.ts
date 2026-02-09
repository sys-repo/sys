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
    const { baseUrl } = props;
    const id = `slug-playback-${slug()}`;
    const ref = Immutable.clonerRef<State>({});
    const controller = EffectController.create({ id, ref, props });

    const setBundle = (bundle?: t.TimecodePlaybackDriver.Wire.Bundle) => {
      const base = controller.current().playback ?? {};
      const playback = { ...base, bundle };
      controller.next({ playback });
    };

    /** Wire effects. */
    const slugAdapter = makeSlugAdapter(controller);
    const playbackAdapter = makePlaybackAdapter(controller);
    attachPlaybackDriverEffect(playbackAdapter);
    attachSlugLoaderEffect(slugAdapter, { baseUrl, setBundle });

    return controller;
  },
};

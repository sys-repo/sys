import { type t, EffectController, Immutable, slug } from '../common.ts';
import { attachPlaybackDriverEffect } from './u.attachPlaybackDriverEffect.ts';
import { attachSlugLoaderEffect } from './u.attachSlugLoaderEffect.ts';

type State = t.SlugPlaybackState;
type Props = t.SlugPlaybackControllerProps;

/**
 * SlugPlaybackController factory.
 */
export const Controller: t.SlugPlaybackControllerLib = {
  create(props) {
    const id = `slug-playback-${slug()}`;
    const ref = Immutable.clonerRef<State>({});
    const controller = EffectController.create<State, Props>({ id, ref, props });

    // Wire effects.
    attachSlugLoaderEffect(controller, {});
    attachPlaybackDriverEffect(controller);

    return controller;
  },
};

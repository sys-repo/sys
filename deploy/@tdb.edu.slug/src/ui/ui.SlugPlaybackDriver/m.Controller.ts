import { type t, EffectController, Immutable, slug } from '../common.ts';
import { attachSlugLoaderEffect } from './u.attachSlugLoaderEffect.ts';

type State = t.SlugPlaybackState;
type Patch = t.SlugPlaybackPatch;
type Props = t.SlugPlaybackControllerProps;

/**
 * Factory for SlugPlaybackController.
 */
export const Controller: t.SlugPlaybackControllerLib = {
  create(props) {
    const { baseUrl } = props;
    const id = `slug-playback-${slug()}`;
    const ref = Immutable.clonerRef<State>({});
    const controller = EffectController.create<State, Patch, Props>({ id, ref, props });

    // Wire effects.
    attachSlugLoaderEffect(controller, { baseUrl });

    return controller;
  },
};

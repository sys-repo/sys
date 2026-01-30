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
    const playbackAdapter = {
      disposed: controller.disposed,
      dispose$: controller.dispose$,
      current: () => controller.current().playback,
      onChange(fn: (state: t.SlugPlaybackRuntimeState | undefined) => void) {
        return controller.onChange((state) => fn(state.playback));
      },
      next(patch: Partial<t.SlugPlaybackRuntimeState>) {
        const playback = { ...(controller.current().playback ?? {}), ...patch };
        controller.next({ playback });
      },
    };

    const slugAdapter = {
      disposed: controller.disposed,
      dispose$: controller.dispose$,
      current: () => controller.current().slug,
      onChange(fn: (state: t.SlugPlaybackSlugState | undefined) => void) {
        return controller.onChange((state) => fn(state.slug));
      },
      next(patch: Partial<t.SlugPlaybackSlugState>) {
        const slug = { ...(controller.current().slug ?? {}), ...patch };
        controller.next({ slug });
      },
    };

    const setBundle = (bundle: t.TimecodePlaybackDriver.Wire.Bundle | undefined) => {
      controller.next({ playback: { ...(controller.current().playback ?? {}), bundle } });
    };

    attachSlugLoaderEffect(slugAdapter, { baseUrl: props.baseUrl, setBundle });
    attachPlaybackDriverEffect(playbackAdapter);

    return controller;
  },
};

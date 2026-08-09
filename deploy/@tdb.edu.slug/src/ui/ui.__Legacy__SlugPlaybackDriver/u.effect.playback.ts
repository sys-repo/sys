import { type t } from './common.ts';

type T = t.PlaybackEffectAdapter;

export function makePlaybackAdapter(controller: t.SlugPlaybackController): T {
  return {
    get dispose$() {
      return controller.dispose$;
    },
    get disposed() {
      return controller.disposed;
    },
    current: () => controller.current().playback,
    onChange: (fn) => controller.onChange((state) => fn(state.playback)),
    next(patch) {
      const base = controller.current().playback ?? {};
      const playback = { ...base, ...patch };
      controller.next({ playback });
    },
  };
}

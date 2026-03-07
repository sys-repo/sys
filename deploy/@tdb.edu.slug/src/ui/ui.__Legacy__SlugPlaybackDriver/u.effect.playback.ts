import { type t, Rx } from './common.ts';

type T = t.PlaybackEffectAdapter;

export function makePlaybackAdapter(controller: t.SlugPlaybackController): T {
  return Rx.toLifecycleView<T>(controller, {
    current: () => controller.current().playback,
    onChange: (fn) => controller.onChange((state) => fn(state.playback)),
    next(patch) {
      const base = controller.current().playback ?? {};
      const playback = { ...base, ...patch };
      controller.next({ playback });
    },
  });
}

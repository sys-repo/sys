import { type t, Rx } from './common.ts';

type T = t.SlugEffectAdapter;

export function makeSlugAdapter(controller: t.SlugPlaybackController): T {
  return Rx.toLifecycleView<T>(controller, {
    current: () => controller.current().slug,
    onChange: (fn) => controller.onChange((state) => fn(state.slug)),
    next(patch) {
      const base = controller.current().slug ?? {};
      const slug = { ...base, ...patch };
      controller.next({ slug });
    },
  });
}

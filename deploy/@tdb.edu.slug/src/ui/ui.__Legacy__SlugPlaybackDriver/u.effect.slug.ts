import { type t } from './common.ts';

type T = t.SlugEffectAdapter;

export function makeSlugAdapter(controller: t.SlugPlaybackController): T {
  return {
    get dispose$() {
      return controller.dispose$;
    },
    get disposed() {
      return controller.disposed;
    },
    current: () => controller.current().slug,
    onChange: (fn) => controller.onChange((state) => fn(state.slug)),
    next(patch) {
      const base = controller.current().slug ?? {};
      const slug = { ...base, ...patch };
      controller.next({ slug });
    },
  };
}

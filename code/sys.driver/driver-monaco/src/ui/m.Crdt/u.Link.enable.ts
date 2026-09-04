import { type t, Is, Rx } from './common.ts';
import { create } from './u.Link.create.ts';
import { register } from './u.Link.register.ts';

export const enable: t.EditorCrdt.Link.Enable = async (ctx, repo, opts) => {
  const options = wrangle.options(opts);
  const life = Rx.lifecycle(options.until);
  const sub = await register(ctx, async (ev) => {
    if (life.disposed) return;
    if (ev.is.create) {
      const res = await create(ctx, repo, ev.bounds);
      options.onCreate?.(res);
    }
  });
  life.dispose$.subscribe(() => sub.dispose());
  return life;
};

/**
 * Helpers:
 */
const wrangle = {
  options(input: Parameters<t.EditorCrdt.Link.Enable>[2]): t.EditorCrdt.Link.EnableOptions {
    if (!input) return {};
    if (Is.until(input)) return { until: input };
    if (Is.record(input)) return input;
    return {};
  },
} as const;

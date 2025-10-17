import { type t, Is, Rx } from './common.ts';
import { create } from './u.Link.create.ts';
import { register } from './u.Link.register.ts';

export const enable: t.EditorCrdtLinkEnable = (ctx, repo, opts) => {
  const options = wrangle.options(opts);
  const life = Rx.lifecycle(options.until);
  const sub = register(ctx, (ev) => {
    if (life.disposed) return;
    if (ev.is.create) {
      const res = create(ctx, repo, ev.bounds);
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
  options(input: Parameters<t.EditorCrdtLinkEnable>[2]): t.EditorCrdtLinkEnableOptions {
    if (!input) return {};
    if (Is.until(input)) return { until: input };
    if (Is.record(input)) return input;
    return {};
  },
} as const;

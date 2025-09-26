import { type t, Rx } from './common.ts';
import { create } from './u.Link.create.ts';
import { register } from './u.Link.register.ts';

export const enable: t.EditorCrdtLinkEnable = (ctx, repo, options = {}) => {
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

import { type t, D, Effect, Immutable, slug } from './common.ts';
import { reduceInput } from './u.reduce.ts';
import { initialState, toView } from './u.ts';

export const TreeContentController: t.TreeContentController.Lib = {
  create(props) {
    const id = `${D.idPrefix}${slug()}`;
    const cfg: t.TreeContentController.Props = props ?? {};
    if (cfg.ref && cfg.initial === undefined) {
      throw new Error('TreeContentController.create: initial is required when ref is provided.');
    }
    const input = typeof cfg.initial === 'function' ? cfg.initial() : cfg.initial;
    const seed = initialState(input ?? {});
    const ref = cfg.ref ?? Immutable.clonerRef<t.TreeContentController.State>(seed);

    const controller = Effect.Controller.create<
      t.TreeContentController.State,
      t.TreeContentController.Patch,
      t.TreeContentController.Props
    >({ id, ref, props: cfg });

    const api = controller as t.TreeContentController;
    api.view = () => toView(api.current());
    api.intent = (next) => {
      const patch = reduceInput(api.current(), next, seed);
      if (!patch) return;
      api.next(patch);
    };

    return api;
  },
};

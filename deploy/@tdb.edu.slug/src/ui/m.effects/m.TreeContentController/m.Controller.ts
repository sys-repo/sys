import { type t, D, EffectController, Immutable, slug } from './common.ts';
import { reduceInput } from './u.reduce.ts';
import { initialState, toView } from './u.ts';

export const TreeContentController: t.TreeContentController.Lib = {
  create(props) {
    const id = `${D.idPrefix}${slug()}`;
    const cfg: t.TreeContentController.Props = props ?? {};
    const initial = initialState(cfg.initial ?? {});
    const ref = cfg.ref ?? Immutable.clonerRef<t.TreeContentController.State>(initial);

    const controller = EffectController.create<
      t.TreeContentController.State,
      t.TreeContentController.Patch,
      t.TreeContentController.Props
    >({ id, ref, props: cfg });

    const api = controller as t.TreeContentController;
    api.view = () => toView(api.current());
    api.intent = (next) => {
      const patch = reduceInput(api.current(), next);
      if (!patch) return;
      api.next(patch);
    };

    return api;
  },
};

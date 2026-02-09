import { type t, D, EffectController, Immutable, slug } from './common.ts';
import { reduceInput } from './u.reduce.ts';
import { initialState, toView } from './u.ts';

export const TreeContentController: t.TreeContentController.Lib = {
  create(props = {}) {
    const id = `${D.idPrefix}${slug()}`;
    const ref = Immutable.clonerRef<t.TreeContentController.State>(
      initialState(props.initial ?? {}),
    );
    const controller = EffectController.create<
      t.TreeContentController.State,
      t.TreeContentController.Patch,
      t.TreeContentController.Props
    >({ id, ref, props });

    const api = controller as t.TreeContentController;
    api.intent = (next) => {
      const patch = reduceInput(api.current(), next);
      if (!patch) return;
      api.next(patch);
    };
    api.view = () => toView(api.current());

    return api;
  },
};

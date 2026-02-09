import { type t, EffectController, Immutable, slug } from './common.ts';
import { reduceInput } from './u.reduce.ts';
import { normalizeState, toView } from './u.ts';

export const TreeEffectController: t.TreeEffectController.Lib = {
  create(props = {}) {
    const id = `tree-effect-${slug()}`;
    const ref = Immutable.clonerRef<t.TreeEffectController.State>(
      normalizeState(props.initial ?? {}),
    );
    const controller = EffectController.create<
      t.TreeEffectController.State,
      t.TreeEffectController.Patch,
      t.TreeEffectController.Props
    >({ id, ref, props });

    const api = controller as t.TreeEffectController;
    api.input = (next) => {
      const patch = reduceInput(api.current(), next);
      if (!patch) return;
      api.next(patch);
    };
    api.view = () => toView(api.current());

    return api;
  },
};

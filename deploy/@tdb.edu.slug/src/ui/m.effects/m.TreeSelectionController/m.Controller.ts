import { type t, EffectController, Immutable, slug } from './common.ts';
import { reduceInput } from './u.reduce.ts';
import { normalizeState, toView } from './u.ts';

export const TreeSelectionController: t.TreeSelectionController.Lib = {
  create(props = {}) {
    const id = `tree-effect-${slug()}`;
    const ref = Immutable.clonerRef<t.TreeSelectionController.State>(
      normalizeState(props.initial ?? {}),
    );
    const controller = EffectController.create<
      t.TreeSelectionController.State,
      t.TreeSelectionController.Patch,
      t.TreeSelectionController.Props
    >({ id, ref, props });

    const api = controller as t.TreeSelectionController;
    const intent: t.TreeSelectionController['intent'] = (next) => {
      const patch = reduceInput(api.current(), next);
      if (!patch) return;
      api.next(patch);
    };
    api.intent = intent;
    api.view = () => toView(api.current());

    return api;
  },
};

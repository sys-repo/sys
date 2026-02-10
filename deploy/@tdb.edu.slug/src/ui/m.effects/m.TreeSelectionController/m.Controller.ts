import { type t, Effect, Immutable, slug } from './common.ts';
import { reduceInput } from './u.reduce.ts';
import { normalizeState, toView } from './u.ts';

export const TreeSelectionController: t.TreeSelectionController.Lib = {
  create(props = {}) {
    const id = `tree-effect-${slug()}`;
    const cfg: t.TreeSelectionController.Props = props;
    const input = typeof cfg.initial === 'function' ? cfg.initial() : cfg.initial;
    const seed = normalizeState({
      tree: undefined,
      selectedPath: undefined,
      selectedRef: undefined,
      ...(input ?? {}),
    });
    const ref = Immutable.clonerRef<t.TreeSelectionController.State>(seed);
    const controller = Effect.Controller.create<
      t.TreeSelectionController.State,
      t.TreeSelectionController.Patch,
      t.TreeSelectionController.Props
    >({ id, ref, props: cfg });

    const api = controller as t.TreeSelectionController;
    const intent: t.TreeSelectionController['intent'] = (next) => {
      const patch = reduceInput(api.current(), next, seed);
      if (!patch) return;
      api.next(patch);
    };
    api.intent = intent;
    api.view = () => toView(api.current());

    return api;
  },
};

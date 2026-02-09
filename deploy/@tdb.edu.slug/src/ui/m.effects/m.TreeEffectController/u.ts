import { type t, DEFAULT, EffectController, Immutable, Is, Obj, slug } from './common.ts';
import { TreeData } from '../../m.data/mod.ts';

export function normalizeState(input: t.TreeEffectController.Patch): t.TreeEffectController.Patch {
  if ('tree' in input && !input.tree) {
    return {
      ...input,
      tree: undefined,
      selectedPath: undefined,
      selectedRef: undefined,
      content: undefined,
      loading: { ...(input.loading ?? {}), tree: false, content: false },
    };
  }

  return {
    ...input,
    loading: input.loading ?? DEFAULT.LOADING,
  };
}
export function toView(state: t.TreeEffectController.State): t.TreeEffectController.View {
  return {
    treeHost: {
      tree: state.tree,
      selectedPath: state.selectedPath,
    },
    selection: {
      path: state.selectedPath,
      ref: state.selectedRef,
    },
    loading: state.loading ?? {},
    content: state.content,
  };
}

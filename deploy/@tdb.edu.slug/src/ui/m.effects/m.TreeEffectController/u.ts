import { type t } from './common.ts';

export function normalizeState(input: t.TreeEffectController.Patch): t.TreeEffectController.Patch {
  if ('tree' in input && !input.tree) {
    return {
      ...input,
      tree: undefined,
      selectedPath: undefined,
      selectedRef: undefined,
    };
  }

  return input;
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
  };
}

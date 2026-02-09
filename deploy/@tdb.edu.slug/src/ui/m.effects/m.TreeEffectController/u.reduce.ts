import { type t } from './common.ts';
import { fromPathRequest, fromRefRequest, fromTreeSet } from './u.from.ts';
import { normalizeState } from './u.ts';

export function reduceInput(
  current: t.TreeEffectController.State,
  input: t.TreeEffectController.Input,
): t.TreeEffectController.Patch | undefined {
  switch (input.type) {
    case 'reset':
    case 'tree.clear':
      return normalizeState({
        tree: undefined,
        selectedPath: undefined,
        selectedRef: undefined,
        content: undefined,
        loading: { ...current.loading, tree: false, content: false },
        error: undefined,
      });
    case 'tree.set':
      return fromTreeSet(current, input.tree);
    case 'path.request':
      return fromPathRequest(current, input.path);
    case 'ref.request':
      return fromRefRequest(current, input.ref);
    case 'content.loading':
      return normalizeState({
        selectedRef: input.ref ?? current.selectedRef,
        loading: { ...current.loading, content: true },
      });
    case 'content.clear':
      return normalizeState({
        content: undefined,
        loading: { ...current.loading, content: false },
      });
    case 'content.set':
      return normalizeState({
        content: input.data,
        loading: { ...current.loading, content: false },
      });
    default:
      return undefined;
  }
}

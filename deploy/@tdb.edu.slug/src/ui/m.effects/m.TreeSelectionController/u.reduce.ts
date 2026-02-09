import { type t } from './common.ts';
import { fromPathRequest, fromRefRequest, fromTreeSet } from './u.from.ts';
import { normalizeState } from './u.ts';

export function reduceInput(
  current: t.TreeSelectionController.State,
  input: t.TreeSelectionController.Input,
): t.TreeSelectionController.Patch | undefined {
  switch (input.type) {
    case 'reset':
    case 'tree.clear':
      return normalizeState({
        tree: undefined,
        selectedPath: undefined,
        selectedRef: undefined,
      });

    case 'tree.set':
      return fromTreeSet(current, input.tree);

    case 'path.request':
      return fromPathRequest(current, input.path);

    case 'ref.request':
      return fromRefRequest(current, input.ref);

    default:
      return undefined;
  }
}

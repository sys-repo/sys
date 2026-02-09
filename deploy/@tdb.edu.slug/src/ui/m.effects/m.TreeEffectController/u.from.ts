import { TreeData } from '../../m.data/mod.ts';
import { type t, Is } from './common.ts';
import { normalizeState } from './u.ts';

export function fromTreeSet(
  current: t.TreeEffectController.State,
  tree: t.TreeHostViewNodeList,
): t.TreeEffectController.Patch {
  const pathFromRef = TreeData.findPathByRef(tree, current.selectedRef);
  const pathFromPath = TreeData.findViewNode(tree, current.selectedPath)?.path;
  const selectedPath = pathFromRef ?? pathFromPath;
  const selectedRef = refFromPath(tree, selectedPath);

  return normalizeState({
    tree,
    selectedPath,
    selectedRef,
  });
}

export function fromPathRequest(
  current: t.TreeEffectController.State,
  path?: t.ObjectPath,
): t.TreeEffectController.Patch {
  const tree = current.tree;
  if (!tree) return normalizeState({ selectedPath: undefined, selectedRef: undefined });

  const selectedPath = TreeData.findViewNode(tree, path)?.path;
  const selectedRef = refFromPath(tree, selectedPath);
  return normalizeState({
    selectedPath,
    selectedRef,
  });
}

export function fromRefRequest(
  current: t.TreeEffectController.State,
  ref?: string,
): t.TreeEffectController.Patch {
  const tree = current.tree;
  if (!tree) {
    return normalizeState({
      selectedPath: undefined,
      selectedRef: undefined,
    });
  }

  if (!Is.str(ref) || ref.length === 0) {
    return normalizeState({
      selectedPath: current.selectedPath,
      selectedRef: refFromPath(tree, current.selectedPath),
    });
  }

  const selectedPath = TreeData.findPathByRef(tree, ref);
  if (!selectedPath) {
    return normalizeState({
      selectedPath: current.selectedPath,
      selectedRef: refFromPath(tree, current.selectedPath),
    });
  }

  const selectedRef = refFromPath(tree, selectedPath);
  return normalizeState({
    selectedPath,
    selectedRef,
  });
}

export function refFromPath(
  tree: t.TreeHostViewNodeList | undefined,
  path: t.ObjectPath | undefined,
) {
  const node = TreeData.findViewNode(tree, path);
  const value = node?.value;
  return value && 'ref' in value && Is.str(value.ref) ? value.ref : undefined;
}

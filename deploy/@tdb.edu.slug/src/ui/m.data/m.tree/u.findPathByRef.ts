import { type t, Arr, Is } from '../common.ts';

/**
 * TreeView ref lookup (pure); resolves a node path by `value.ref`.
 */
export const findPathByRef: t.TreeDataLib['findPathByRef'] = (tree, ref) => {
  if (!Arr.isArray(tree) || tree.length === 0) return undefined;
  if (!Is.str(ref) || ref.length === 0) return undefined;

  const stack: t.TreeHostViewNode[] = [...tree];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;

    const value = node.value;
    const nodeRef = value && 'ref' in value && Is.str(value.ref) ? value.ref : undefined;
    if (nodeRef === ref) return node.path;

    const children = node.children;
    if (Arr.isArray(children) && children.length > 0) {
      for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]!);
    }
  }

  return undefined;
};

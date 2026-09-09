import React from 'react';
import { type t, Data, Obj } from './common.ts';

export type PropsModel = {
  readonly rootList: t.TreeViewNodeList;
  readonly path: t.ObjectPath;
  readonly effective: { readonly path: t.ObjectPath; readonly view: t.TreeViewNodeView[] };
  readonly leaf?: t.ReactNode;
  readonly animKey: string;
  readonly dir: -1 | 0 | 1;
};

export function usePropsNormalizer(props: t.IndexTreeViewProps): PropsModel {
  const rootList = React.useMemo(() => Data.toList(props.root), [props.root]);

  /**
   * Normalize incoming selection path and resolve the addressed node.
   */
  const path = (props.path ?? []) as t.ObjectPath;
  const pathKey = Obj.Path.encode(path);
  const selectedNode = React.useMemo(
    () => Data.find(rootList, ({ node }) => node.key === pathKey),
    [rootList, pathKey],
  );

  /**
   * Guard against stale paths by falling back to root-level view.
   */
  const effectivePath = React.useMemo<t.ObjectPath>(() => {
    const hasSelectedPath = path.length > 0;
    return hasSelectedPath && !selectedNode ? [] : path;
  }, [path, selectedNode]);
  const effectivePathKey = Obj.Path.encode(effectivePath);
  const effectiveView = React.useMemo(
    () => Data.viewAt(rootList, effectivePath),
    [rootList, effectivePathKey],
  );

  /**
   * Resolve leaf renderer output only when the selected node is a leaf.
   */
  const selectedLeaf = selectedNode && !Data.hasChildren(selectedNode) ? selectedNode : undefined;
  const leaf = selectedLeaf
    ? props.renderLeaf?.({ root: rootList, path: effectivePath, node: selectedLeaf })
    : undefined;

  /**
   * Compute slide direction from effective path depth changes.
   */
  const prevPathRef = React.useRef<t.ObjectPath>(effectivePath);
  const prev = prevPathRef.current;
  const depthDelta = effectivePath.length - prev.length;
  const dir: -1 | 0 | 1 = depthDelta > 0 ? 1 : depthDelta < 0 ? -1 : 0;
  React.useEffect(() => void (prevPathRef.current = effectivePath), [effectivePath]);

  return {
    leaf,
    rootList,
    path,
    effective: { path: effectivePath, view: effectiveView },
    animKey: effectivePathKey,
    dir,
  };
}

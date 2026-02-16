import { Signal } from '../../-test.ui.ts';
import { TreeHost } from '../mod.ts';
import { FooLeaf } from './-ui.foobar.leaf.tsx';
import { type t, Obj } from './common.ts';

export type SpecRootProps = {
  debug: t.DebugSignals;
};

/**
 * Component:
 */
export const SpecRoot: React.FC<SpecRootProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);

  const path = v.selectedPath ?? [];
  const selectedNode = v.tree
    ? TreeHost.Data.find(v.tree, (e) => Obj.Path.eql(e.node.path, path))
    : undefined;

  const selectedLeaf = selectedNode && !selectedNode.children?.length ? selectedNode : undefined;
  const renderLeaf = (title: string, padding?: t.CssPaddingInput) => {
    if (!selectedLeaf) return null;
    return (
      <FooLeaf title={title} theme={v.theme} path={path} node={selectedLeaf} padding={padding} />
    );
  };

  const mainSlot = v.slots.main ?? (selectedLeaf ? renderLeaf('Main Leaf Content', 40) : undefined);

  const slots: t.TreeHostSlots = {
    ...v.slots,
    empty: v.customEmpty ? (e) => 'Hello Empty 👋' : undefined,
    main: mainSlot,
    treeLeaf(e) {
      const selectedKey = selectedLeaf?.key;
      if (!selectedKey || e.node.key !== selectedKey) return undefined;
      return renderLeaf('Tree Leaf Panel');
    },
  };

  /**
   * Render:
   */
  return (
    <TreeHost.UI
      debug={v.debug}
      theme={v.theme}
      slots={slots}
      tree={v.tree}
      nav={v.nav}
      selectedPath={v.selectedPath}
      spinner={v.spinner}
      onPathRequest={(e) => {
        console.info('⚡️ onPathRequest: ', e);
        p.selectedPath.value = e.path;
      }}
      onNodeSelect={(e) => {
        console.info('⚡️ onNodeSelect: ', e);
        if (!e.is.leaf) return;
        p.selectedPath.value = e.path;
      }}
    />
  );
};

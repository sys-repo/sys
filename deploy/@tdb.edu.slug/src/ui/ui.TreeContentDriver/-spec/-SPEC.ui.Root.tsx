import React from 'react';
import { BackButton, TreeHost } from '../../ui.TreeHost/-spec/mod.ts';
import { TreeData } from '../../m.data/mod.ts';
import { type t, Color, css, EffectController, Signal } from './common.ts';

export type SpecRootProps = {
  debug: t.DebugSignals;
  style?: t.CssValue;
};

/**
 * Component:
 */
export const SpecRoot: React.FC<SpecRootProps> = (props) => {
  const { debug } = props;
  const v = Signal.toObject(debug.props);
  const selection =
    EffectController.useEffectController(debug.orchestrator.selection) ??
    debug.orchestrator.selection.current();
  const content =
    EffectController.useEffectController(debug.orchestrator.content) ??
    debug.orchestrator.content.current();
  const view = debug.orchestrator.selection.view();
  const loading = content.phase === 'loading';

  /**
   * Render:
   */
  const theme = Color.theme(v.theme);
  const styles = {
    base: css({ position: 'relative', display: 'grid' }),
    back: css({ Absolute: [-35, null, null, -35] }),
  };

  return (
    <div className={styles.base.class}>
      <BackButton
        style={styles.back}
        theme={theme.name}
        selectedPath={view.treeHost.selectedPath}
        onBack={(e) => debug.orchestrator.selection.intent({ type: 'path.request', path: e.next })}
      />
      <TreeHost.UI
        debug={v.debug}
        theme={theme.name}
        tree={view.treeHost.tree}
        selectedPath={view.treeHost.selectedPath}
        slots={{
          main:
            content.phase === 'ready' ? (
              <div>{'Main content'}</div>
            ) : loading ? (
              <div>{'Loading content'}</div>
            ) : undefined,
          aux: <div>{content.phase === 'error' ? content.error?.message ?? 'Error' : ''}</div>,
          treeLeaf: (e) => {
            const node = TreeData.findViewNode(selection.tree, selection.selectedPath);
            const isSelectedLeaf = !!node && node.key === e.node.key;
            if (!isSelectedLeaf || content.phase !== 'ready') return <div>{''}</div>;
            return <div>{'Leaf content'}</div>;
          },
        }}
        onPathRequest={(e) => debug.orchestrator.selection.intent({ type: 'path.request', path: e.path })}
        onNodeSelect={(e) => {
          if (!e.is.leaf) return;
          debug.orchestrator.selection.intent({ type: 'path.request', path: e.path });
        }}
      />
    </div>
  );
};

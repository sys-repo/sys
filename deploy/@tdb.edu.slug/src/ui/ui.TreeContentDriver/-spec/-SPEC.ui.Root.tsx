import React from 'react';
import { TreeData } from '../../m.data/mod.ts';
import { BackButton, TreeHost } from '../../ui.TreeHost/-spec/mod.ts';
import { type t, Color, css, Signal, useEffectController } from './common.ts';

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
    useEffectController(debug.orchestrator.selection) ?? debug.orchestrator.selection.current();
  const content =
    useEffectController(debug.orchestrator.content) ?? debug.orchestrator.content.current();

  const view = debug.orchestrator.selection.view();
  const loading = content.phase === 'loading';
  const lastReady = React.useRef<t.TreeContentController.State | undefined>(undefined);

  React.useEffect(() => {
    if (content.phase !== 'ready') return;
    lastReady.current = content;
  }, [content]);

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
            content.phase === 'ready' || (loading && !!lastReady.current) ? (
              <div>
                <div>{'Main content'}</div>
                {loading ? <div>{'Loading content'}</div> : undefined}
              </div>
            ) : loading ? (
              <div>{'Loading content'}</div>
            ) : undefined,
          aux: <div>{content.phase === 'error' ? (content.error?.message ?? 'Error') : ''}</div>,
          treeLeaf: (e) => {
            const node = TreeData.findViewNode(selection.tree, selection.selectedPath);
            const isSelectedLeaf = !!node && node.key === e.node.key;
            if (!isSelectedLeaf) return <div>{''}</div>;
            if (content.phase === 'ready') return <div>{'Leaf content'}</div>;
            if (loading && !!lastReady.current) {
              return (
                <div>
                  <div>{'Leaf content'}</div>
                  <div>{'Loading content'}</div>
                </div>
              );
            }
            if (loading) return <div>{'Loading content'}</div>;
            return <div>{''}</div>;
          },
        }}
        onPathRequest={(e) =>
          debug.orchestrator.selection.intent({ type: 'path.request', path: e.path })
        }
        onNodeSelect={(e) => {
          if (!e.is.leaf) return;
          debug.orchestrator.selection.intent({ type: 'path.request', path: e.path });
        }}
      />
    </div>
  );
};

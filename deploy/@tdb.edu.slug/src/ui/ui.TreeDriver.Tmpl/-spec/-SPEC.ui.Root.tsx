import React from 'react';
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
  const p = debug.props;
  const v = Signal.toObject(p);
  useEffectController(debug.selection);
  const view = debug.selection.view();

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
        onBack={(e) => debug.selection.intent({ type: 'path.request', path: e.next })}
      />
      <TreeHost.UI
        debug={v.debug}
        theme={theme.name}
        tree={view.treeHost.tree}
        selectedPath={view.treeHost.selectedPath}
        onPathRequest={(e) => debug.selection.intent({ type: 'path.request', path: e.path })}
        onNodeSelect={(e) => {
          if (!e.is.leaf) return;
          debug.selection.intent({ type: 'path.request', path: e.path });
        }}
      />
    </div>
  );
};

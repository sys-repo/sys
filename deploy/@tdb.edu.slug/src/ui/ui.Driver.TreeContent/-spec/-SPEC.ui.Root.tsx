import React from 'react';
import { BackButton, TreeHost } from '../../ui.TreeHost/-spec/mod.ts';
import { createSlots } from '../../ui.Driver.Tree.shared/-spec.slots.shared/mod.ts';
import { useEffectControllers } from './-use.EffectControllers.ts';
import { type t, Color, css, Signal } from './common.ts';

export type SpecRootProps = {
  debug: t.DebugSignals;
  style?: t.CssValue;
};

/**
 * Component:
 */
export const SpecRoot: React.FC<SpecRootProps> = (props) => {
  const { debug } = props;
  const orchestrator = debug.orchestrator;
  const v = Signal.toObject(debug.props);

  const { selection, content } = useEffectControllers(debug);
  const view = orchestrator.selection.view();
  const loading = content.phase === 'loading';
  const spinner: t.TreeHostProps['spinner'] = loading
    ? [{ slot: 'nav:tree', position: 'top' }, { slot: 'main:body' }]
    : undefined;

  /**
   * Render:
   */
  const theme = Color.theme(v.theme);
  const styles = {
    base: css({ position: 'relative', display: 'grid' }),
    back: css({ Absolute: [-35, null, null, -35] }),
  };

  const slots = createSlots({
    content,
    selection,
    theme: theme.name,
  });

  return (
    <div className={styles.base.class}>
      <BackButton
        style={styles.back}
        theme={theme.name}
        selectedPath={view.treeHost.selectedPath}
        onBack={(e) => orchestrator.selection.intent({ type: 'path.request', path: e.next })}
      />
      <TreeHost.UI
        debug={v.debug}
        theme={theme.name}
        tree={view.treeHost.tree}
        selectedPath={view.treeHost.selectedPath}
        spinner={spinner}
        slots={slots}
        onPathRequest={(e) => orchestrator.selection.intent({ type: 'path.request', path: e.path })}
        onNodeSelect={(e) => {
          if (!e.is.leaf) return;
          orchestrator.selection.intent({ type: 'path.request', path: e.path });
        }}
      />
    </div>
  );
};

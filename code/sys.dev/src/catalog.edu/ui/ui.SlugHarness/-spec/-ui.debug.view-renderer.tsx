import React from 'react';

import { type t, Button, Color, Crdt, css, KeyValue, Lens, Signal } from '../common.ts';
import { InfoPanel } from '../ui.InfoPanel.tsx';
import type { DebugSignals } from './-SPEC.Debug.tsx';

type O = Record<string, unknown>;

export type SlugViewsProps = {
  debug: DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const SlugViews: React.FC<SlugViewsProps> = (props) => {
  const { debug } = props;

  const registry = debug.registry;
  const s = debug.signals;
  const p = debug.props;
  const v = Signal.toObject(p);
  const doc = s.doc.value;
  const currentView = p.slugView.value;

  /**
   * Handlers:
   */
  function handleClick(item?: t.SlugViewRegistryItem) {
    console.info('⚡️ clicked/item:', item);
  }

  /**
   * Effects:
   */
  Signal.useRedrawEffect(debug.listen);
  Crdt.UI.useRev(doc);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <InfoPanel
        theme={theme.name}
        style={{ Margin: [20, 45] }}
        registry={registry}
        doc={doc}
        path={{ doc: v.path.doc, slug: v.path.slug }}
        currentView={currentView}
      />
    </div>
  );
};

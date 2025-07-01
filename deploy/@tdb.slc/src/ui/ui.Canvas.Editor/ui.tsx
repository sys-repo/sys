import React from 'react';
import { type t, CanvasLayout, CanvasPanel, Color, Crdt, css } from './common.ts';

type P = t.EditorCanvasProps;

/**
 * Component:
 */
export const EditorCanvas: React.FC<P> = (props) => {
  const { debug = false, doc, borderRadius } = props;
  const active = !!doc;
  const panels = active ? wrangle.panels(props) : {};

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      opacity: active ? 1 : 0.3,
      transition: `opacity 120ms ease`,
      pointerEvents: active ? 'auto' : 'none',
    }),
  };

  const elLayout = active && (
    <CanvasLayout
      //
      theme={theme.name}
      panels={panels}
      debug={debug}
      debugSize={props.debugSize}
      style={{ borderRadius }}
    />
  );

  return <div className={css(styles.base, props.style).class}>{elLayout}</div>;
};

/**
 * Helpers:
 */
const wrangle = {
  panels(props: P): t.CanvasPanelContentMap {
    const { doc } = props;
    const panels: t.CanvasPanelContentMap = {};

    const render = (panel: t.CanvasPanel): t.CanvasPanelContent => {
      const path = [...(props.path ?? []), panel, 'text'];
      const view = (
        <Crdt.UI.TextPanel
          doc={doc}
          path={path}
          theme={props.theme}
          label={panel}
          style={{ padding: 8 }}
          scroll={true}
        />
      );
      return { view };
    };

    CanvasPanel.all.forEach((panel) => (panels[panel] = render(panel)));
    return panels;
  },
} as const;

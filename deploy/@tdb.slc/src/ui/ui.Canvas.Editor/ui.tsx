import React from 'react';
import { type t, CanvasLayout, Color, css } from './common.ts';

type P = t.EditorCanvasProps;

/**
 * Component:
 */
export const EditorCanvas: React.FC<P> = (props) => {
  const { debug = false, panels = {}, doc } = props;

  console.log('editor/panels', panels);
  console.log('doc', doc);

  const active = !!doc;

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

  return (
    <div className={css(styles.base, props.style).class}>
      <CanvasLayout theme={theme.name} panels={panels} debug={debug} debugSize={props.debugSize} />
    </div>
  );
};

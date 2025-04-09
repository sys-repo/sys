import React from 'react';
import { type t, Color, css, Layout, SheetBase } from './common.ts';

/**
 * Component:
 */
export const Sheet: React.FC<t.SheetProps> = (props) => {
  const { state, is, index, orientation } = props;

  /**
   * Handlers:
   */
  const onClick = () => {
    if (!is.top) state.stack.pop();
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const base = css({
    pointerEvents: 'auto',
    marginTop: Layout.sheetOffset(props.index),
  });
  return (
    <SheetBase.View
      style={css(base, props.style)}
      theme={theme.name}
      edgeMargin={props.edgeMargin}
      orientation={props.orientation}
      onClick={onClick}
    >
      {props.children}
    </SheetBase.View>
  );
};

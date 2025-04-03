import React from 'react';
import { type t, Color, css, Layout, SheetBase } from './common.ts';

export type SheetProps = t.ContentProps & {
  margin?: t.Pixels | [t.Pixels, t.Pixels];
};

/**
 * Component:
 */
export const Sheet: React.FC<SheetProps> = (props) => {
  const { state, isTop } = props;

  /**
   * Handlers:
   */
  const onClick = () => {
    if (!isTop) state.stack.pop();
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
    <SheetBase.View theme={theme.name} style={base} margin={props.margin} onClick={onClick}>
      {props.children}
    </SheetBase.View>
  );
};

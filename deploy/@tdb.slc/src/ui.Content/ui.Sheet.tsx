import React from 'react';
import { type t, BaseSheet, Color, css, DEFAULTS, Layout } from './common.ts';

export type SheetProps = t.ContentProps & {};

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
    color: theme.fg,
    backgroundColor: theme.bg,
    pointerEvents: 'auto',
    marginTop: Layout.sheetOffset(props.index, DEFAULTS.baseSheetOffset),
  });
  return (
    <BaseSheet theme={theme.name} style={base} onClick={onClick}>
      {props.children}
    </BaseSheet>
  );
};

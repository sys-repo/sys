import React from 'react';
import { type t, MobileSheet as BaseSheet, Color, css, DEFAULTS, Layout } from './common.ts';

export type SheetProps = t.ContentProps & {};
const offset = DEFAULTS.baseSheetOffset;

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
    marginTop: Layout.sheetOffset(props.index, offset),
    pointerEvents: 'auto',
  });
  return (
    <BaseSheet theme={theme.name} style={base} onClick={onClick}>
      {props.children}
    </BaseSheet>
  );
};

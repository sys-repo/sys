import React from 'react';
import { type t, Color, css } from './common.ts';
import { Empty } from './ui.Empty.tsx';

type P = t.LayoutTreeSplitProps;

/**
 * Component:
 */
export const Main: React.FC<P> = (props) => {
  const { debug = false, slots = {} } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
    }),
  };

  const elEmpty = (
    <Empty theme={theme.name} children={slots?.empty?.('main') ?? 'No content to display'} />
  );

  return <main className={css(styles.base, props.style).class}>{slots.main ?? elEmpty}</main>;
};

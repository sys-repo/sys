import React from 'react';
import { type t, Color, css } from './common.ts';
import { Spinning, contentStyle, spinnerForSlot } from './ui.Spinning.tsx';
import { Empty } from './ui.Empty.tsx';

type P = t.TreeHostProps;

/**
 * Component:
 */
export const Main: React.FC<P> = (props) => {
  const { debug = false, slots = {} } = props;
  const spinning = spinnerForSlot(props.spinner, 'main');

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
    }),
    content: css({ Absolute: 0, display: 'grid', ...contentStyle(spinning) }),
    spinning: css({ Absolute: 0 }),
  };

  const elEmpty = !slots.main && (
    <Empty theme={theme.name} children={slots?.empty?.('main') ?? 'No content to display'} />
  );
  const elSpinner = spinning && (
    <Spinning
      theme={theme.name}
      position={spinning.position}
      style={styles.spinning}
    />
  );

  return (
    <main className={css(styles.base, props.style).class}>
      <div className={styles.content.class}>{slots.main ?? elEmpty}</div>
      {elSpinner}
    </main>
  );
};

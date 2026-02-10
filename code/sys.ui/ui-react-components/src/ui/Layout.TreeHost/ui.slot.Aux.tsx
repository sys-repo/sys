import React from 'react';
import { type t, Color, css } from './common.ts';
import { Spinning, contentStyle, spinnerForSlot } from './ui.Spinning.tsx';

type P = t.TreeHostProps;

/**
 * Component:
 */
export const Aux: React.FC<P> = (props) => {
  const { debug = false, slots = {} } = props;
  if (!slots.aux) return null;
  const spinning = spinnerForSlot(props.spinner, 'aux');

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
    content: css({ Absolute: 0, display: 'grid', ...contentStyle(spinning) }),
    spinning: css({ Absolute: 0 }),
  };
  const elSpinner = spinning && (
    <Spinning
      theme={theme.name}
      position={spinning.position}
      style={styles.spinning}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.content.class}>{slots.aux}</div>
      {elSpinner}
    </div>
  );
};

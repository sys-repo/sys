import React from 'react';
import { type t, Color, css } from '../common.ts';
import { HarnessSchema } from './schema.ts';

type Slots = { left?: t.ReactNode; right?: t.ReactNode };
export type HarnessProps = t.Infer<typeof HarnessSchema> & { slots?: Slots };

/**
 * Minimal two-pane shell with named slots: { left, right }.
 */
export const Harness: React.FC<HarnessProps> = (props) => {
  const { debug = false, leftWidth = 380, gap = 24 } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme ?? 'Dark');
  const styles = {
    base: css({
      width: '100%',
      height: '100%',
      backgroundColor: theme.bg,
      color: theme.fg,
      fontFamily: 'sans-serif',
      boxSizing: 'border-box',
      display: 'grid',
      gridTemplateColumns: `${Math.max(0, leftWidth)}px 1fr`,
      columnGap: Math.max(0, gap),
    }),
    pane: css({
      minWidth: 0,
      minHeight: 0,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.pane.class}>{props.slots?.left}</div>
      <div className={styles.pane.class}>{props.slots?.right}</div>
    </div>
  );
};

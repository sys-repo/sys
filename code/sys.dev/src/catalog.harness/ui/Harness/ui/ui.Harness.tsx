import React from 'react';

import { type t, Color, SplitPane, css } from '../common.ts';
import { HarnessPropsSchema } from '../schema.ts';
import { useSplitState } from './use.SplitState.ts';

type Slots = { left?: t.ReactNode; right?: t.ReactNode };
export type HarnessProps = t.Infer<typeof HarnessPropsSchema> & {
  slots?: Slots;
  style?: t.CssInput;
};

/**
 * Minimal two-pane shell with named slots: { left, right }.
 */
export const Harness: React.FC<HarnessProps> = (props) => {
  const { debug = false, slots } = props;

  /**
   * Hooks:
   */
  const split = useSplitState(props.state); // split.ratio ∈ [0..1], split.setRatio(n)

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
    }),
    unspecified: css({
      padding: 15,
      fontSize: 12,
    }),
  };

  const unspecified = (name: string) => (
    <div className={styles.unspecified.class}>{`🐷 ${name}: (unspecified)`}</div>
  );
  const elLeft = slots?.left ?? unspecified('Left');
  const elRight = slots?.right ?? unspecified('Right');

  // Controlled ratios for 2 panes: [left, right]
  const left = split.ratio ?? 0.3; // ← fallback to sane default
  const ratios: t.Percent[] = [left, 1 - left];

  return (
    <div className={css(styles.base, props.style).class}>
      <SplitPane
        theme={theme.name}
        value={ratios}
        onChange={(e) => {
          const nextLeft = e.ratios[0] ?? split.ratio;
          split.setRatio(nextLeft);
        }}
      >
        {[elLeft, elRight]}
      </SplitPane>
    </div>
  );
};

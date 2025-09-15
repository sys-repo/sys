import { SplitPane } from '@sys/ui-react-components';
import React from 'react';

import { type t, Color, css } from '../common.ts';
import { HarnessPropsSchema } from '../schema.ts';
import { useSplitState } from './use.SplitState.ts';

type Slots = { left?: t.ReactNode; right?: t.ReactNode };
export type HarnessProps = t.Infer<typeof HarnessPropsSchema> & { slots?: Slots };

/**
 * Minimal two-pane shell with named slots: { left, right }.
 */
export const Harness: React.FC<HarnessProps> = (props) => {
  const { debug = false, slots } = props;

  /**
   * Hooks:
   */
  const split = useSplitState(props.state);

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
    unspecified: css({ padding: 15 }),
  };

  const unspecified = (name: string) => (
    <div className={styles.unspecified.class}>{`${name}: (unspecified)`}</div>
  );
  const elLeft = slots?.left ?? unspecified('Left');
  const elRight = slots?.right ?? unspecified('Right');

  return (
    <div className={css(styles.base, props.style).class}>
      <SplitPane theme={theme.name} value={split.ratio} onChange={(e) => split.setRatio(e.ratio)}>
        {elLeft}
        {elRight}
      </SplitPane>
    </div>
  );
};

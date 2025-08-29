import { SplitPane } from '@sys/ui-react-components';
import React from 'react';

import { type t, Color, css, rx } from '../common.ts';
import { HarnessSchema } from './schema.ts';

type Slots = { left?: t.ReactNode; right?: t.ReactNode };
export type HarnessProps = t.Infer<typeof HarnessSchema> & { slots?: Slots };

/**
 * Minimal two-pane shell with named slots: { left, right }.
 */
export const Harness: React.FC<HarnessProps> = (props) => {
  const { debug = false, slots } = props;
  const state = props.state as t.HarnessStateRef | undefined;

  /**
   * Hooks:
   */
  const splitRatioRef$ = React.useRef<t.Subject<any>>(rx.subject());
  const [splitRatio, setSplitRatio] = React.useState<t.Percent | undefined>(state?.current.split);

  /**
   * Effects:
   */
  React.useEffect(() => splitRatioRef$.current.next(splitRatio), [splitRatio]);
  React.useEffect(() => {
    const life = rx.abortable();


    return life.dispose;
  }, [state?.instance]);

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

  const elLeft = slots?.left ?? (
    <div className={styles.unspecified.class}>{'left: unspecified'}</div>
  );
  const elRight = slots?.right ?? (
    <div className={styles.unspecified.class}>{'right: unspecified'}</div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <SplitPane theme={theme.name} value={splitRatio} onChange={(e) => setSplitRatio(e.ratio)}>
        {elLeft}
        {elRight}
      </SplitPane>
    </div>
  );
};

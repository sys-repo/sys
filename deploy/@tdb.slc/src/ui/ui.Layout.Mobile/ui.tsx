import React from 'react';
import { type t, Color, css, useSizeObserver } from './common.ts';

type P = t.MobileLayoutProps;

export const MobileLayout: React.FC<P> = (props) => {
  const { ctx = {} } = props;
  const { stage } = wrangle.values(props);
  const showBackgroundColor = stage === 'Trailer';

  const size = useSizeObserver();

  console.log('size', size);

  /**
   * Render:
   */
  const theme = Color.theme(wrangle.theme(props));
  const styles = {
    base: css({
      color: theme.fg,
      backgroundColor: showBackgroundColor ? theme.bg : '',
      overflow: 'hidden',
      display: 'grid',
    }),
    body: css({
      position: 'relative',
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div>{`🐷 Hello Mobile Layout: ${ctx.stage}`}</div>
      </div>
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  values(props: P) {
    const { ctx = {} } = props;
    const { stage = 'Entry' } = ctx;
    return { ctx, stage };
  },

  theme(props: P) {
    const { stage } = wrangle.values(props);
    let theme: t.CommonTheme = 'Dark';
    if (stage === 'Trailer') theme = 'Light';
    return theme;
  },
} as const;

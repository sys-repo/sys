import React from 'react';
import { type t, Color, css } from './common.ts';

type P = t.MobileLayoutProps;

export const MobileLayout: React.FC<P> = (props) => {
  const { ctx = {} } = props;

  console.log('ctx', ctx);

  /**
   * Render:
   */
  const theme = Color.theme(wrangle.theme(props));
  const styles = {
    base: css({
      color: theme.fg,
      backgroundColor: theme.bg,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 Hello Mobile Layout: ${ctx.stage}`}</div>
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  theme(props: P) {
    const { ctx = {} } = props;
    const { stage = 'Entry' } = ctx;
    let theme: t.CommonTheme = 'Dark';
    if (stage === 'Trailer') theme = 'Light';
    return theme;
  },
} as const;

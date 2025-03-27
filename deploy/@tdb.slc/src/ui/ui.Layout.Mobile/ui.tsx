import React from 'react';
import { type t, Color, css, Player, Signal, useSizeObserver } from './common.ts';

type P = t.MobileLayoutProps;

export const MobileLayout: React.FC<P> = (props) => {
  const { signals } = props;
  const { stage } = wrangle.values(props);
  const showBackgroundColor = stage === 'Trailer';

  const size = useSizeObserver();
  Signal.useRedrawEffect(() => signals?.listen());

  if (!signals) return null;

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
    body: css({ position: 'relative', display: 'grid', gridTemplateRows: `1fr auto` }),
    top: css({}),
  };

  const elPlayer = stage === 'Trailer' && <Player.Video.View signals={signals.video} />;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div className={styles.top.class}></div>
        {elPlayer}
      </div>
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  values(props: P) {
    const { signals } = props;
    const stage = signals?.stage.value ?? 'Entry';
    return { signals, stage };
  },

  theme(props: P) {
    const { stage } = wrangle.values(props);
    let theme: t.CommonTheme = 'Dark';
    if (stage === 'Trailer') theme = 'Light';
    return theme;
  },
} as const;

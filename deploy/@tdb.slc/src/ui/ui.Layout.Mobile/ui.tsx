import React from 'react';
import { type t, Color, css, Player, useSizeObserver } from './common.ts';

type P = t.MobileLayoutProps;

const video = Player.Video.signals({ src: 'vimeo/1068502644' });

export const MobileLayout: React.FC<P> = (props) => {
  const { ctx = {} } = props;
  const { stage } = wrangle.values(props);
  const showBackgroundColor = stage === 'Trailer';

  const size = useSizeObserver();

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
      display: 'grid',
      gridTemplateRows: `1fr auto`,
    }),
    top: css({
      padding: 10,
    }),
  };

  const elPlayer = stage === 'Trailer' && <Player.Video.View signals={video} />;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div className={styles.top.class}>{`🐷 top`}</div>
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

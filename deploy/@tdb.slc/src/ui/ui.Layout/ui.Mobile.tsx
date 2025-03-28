import React from 'react';
import { type t, App, css, Player, Signal } from './common.ts';

type P = t.LayoutMobileProps;

export const LayoutMobile: React.FC<P> = (props) => {
  const { state } = props;
  const p = state?.props;

  const content = p?.content.value;

  const { stage } = wrangle.values(props);
  const showBackgroundColor = stage === 'Trailer';

  Signal.useRedrawEffect(() => state?.listen());

  if (!p) return null;

  /**
   * Render:
   */
  const theme = App.theme(state);
  const backgroundColor = showBackgroundColor ? theme.bg : '';
  const styles = {
    base: css({ color: theme.fg, backgroundColor, overflow: 'hidden', display: 'grid' }),
    body: css({ position: 'relative', display: 'grid', gridTemplateRows: `1fr auto` }),
    top: css({}),
  };

  const elPlayer = stage === 'Trailer' && <Player.Video.View signals={state.video} />;

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
    const { state: signals } = props;
    const stage = signals?.props.content.value?.id ?? 'Entry';
    return { signals, stage };
  },

  theme(props: P) {
    const { stage } = wrangle.values(props);
    let theme: t.CommonTheme = 'Dark';
    if (stage === 'Trailer') theme = 'Light';
    return theme;
  },
} as const;

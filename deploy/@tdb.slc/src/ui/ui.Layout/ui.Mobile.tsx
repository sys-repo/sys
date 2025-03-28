import React from 'react';
import { type t, App, css, Player, Signal } from './common.ts';

type P = t.LayoutMobileProps;

export const LayoutMobile: React.FC<P> = (props) => {
  const { state } = props;
  const p = state?.props;
  const content = p?.content.value;

  Signal.useRedrawEffect(() => state?.listen());
  if (!p) return null;

  /**
   * Render:
   */
  const theme = App.theme(state);
  const showBackgroundColor = wrangle.showBackgroundColor(state);
  const backgroundColor = showBackgroundColor ? theme.bg : '';

  const styles = {
    base: css({ backgroundColor, color: theme.fg, overflow: 'hidden', display: 'grid' }),
    body: css({ position: 'relative', display: 'grid', gridTemplateRows: `1fr auto` }),
    top: css({}),
  };

  const elPlayer = !!content?.video?.src && <Player.Video.View signals={state.video} />;

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
  showBackgroundColor(state?: t.AppSignals) {
    if (!state) return false;
    return state.props.content.value?.solidBackground?.(state) ?? false;
  },
} as const;

import React from 'react';
import { type t, App, AppContent, css, Player, Signal } from './common.ts';

type P = t.LayoutMobileProps;

export const LayoutMobile: React.FC<P> = (props) => {
  const { state } = props;
  const p = state?.props;
  const content = p?.content.value;

  Signal.useRedrawEffect(() => {
    state?.listen();
    state?.video.props.currentTime.value;
  });
  if (!p) return null;

  /**
   * Render:
   */
  const theme = App.theme(state);
  const showBackgroundColor = AppContent.showBackgroundColor(state);
  const backgroundColor = showBackgroundColor ? theme.bg : '';

  const styles = {
    base: css({ backgroundColor, color: theme.fg, overflow: 'hidden', display: 'grid' }),
    body: css({ position: 'relative', display: 'grid', gridTemplateRows: `1fr auto` }),
    top: css({}),
    bottom: css({}),
  };

  const elBody = AppContent.render(state);

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div className={styles.top.class}>{elBody}</div>
        <div className={styles.bottom.class}>
          {!!content?.video?.src && <Player.Video.View signals={state.video} />}
        </div>
      </div>
    </div>
  );
};

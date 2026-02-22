import React from 'react';
import { type t, Color, KeyValue, Player, css } from './common.ts';

export type NavFooterProps = {
  runtime: t.DevPlaybackRuntime;
  theme: t.CommonTheme;
};

/**
 * Component:
 */
export const NavFooter: React.FC<NavFooterProps> = (props) => {
  const { runtime } = props;

  const theme = Color.theme(props.theme);
  const styles = {
    decks: {
      base: css({ position: 'relative' }),
      traceline: css({
        Absolute: [null, 15, -1, 10],
        backgroundColor: Color.alpha(theme.fg, 0.03),
        height: 1,
      }),
    },
  };

  return (
    <div>
      <div className={styles.decks.base.class}>
        <Player.Video.Decks.UI
          decks={runtime.decks}
          active={runtime.snapshot.state.decks.active}
          show={'both'}
          aspectRatio={'4/3'}
          gap={20}
          style={{ Margin: [10, 20, 10, 20] }}
        />
        <div className={styles.decks.traceline.class} />
      </div>
      <KeyValue.UI
        theme={theme.name}
        layout={{ kind: 'table' }}
        style={{ Margin: [0, 20, 10, 20] }}
        items={[
          { kind: 'title', v: 'Media Runtime' },
          {
            k: 'current:video',
            v: runtime.currentMediaSrc ?? '(none)',
            href: runtime.currentMediaSrc
              ? { v: { infer: true, display: 'trim-http' } }
              : undefined,
            mono: true,
          },
        ]}
      />
    </div>
  );
};

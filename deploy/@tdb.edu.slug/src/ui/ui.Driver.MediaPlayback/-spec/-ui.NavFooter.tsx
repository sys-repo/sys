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
  const traceline = Color.alpha(theme.fg, 0.03);
  const styles = {
    decks: {
      base: css({ position: 'relative' }),
      traceline: {
        center: css({ Absolute: [50, null, -6, '50%'], width: 1, backgroundColor: traceline }),
        bottom: css({ Absolute: [null, 15, -1, 10], height: 1, backgroundColor: traceline }),
      },
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
        <div className={styles.decks.traceline.center.class} />
        <div className={styles.decks.traceline.bottom.class} />
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

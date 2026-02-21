import React from 'react';
import { type t, KeyValue, Player } from './common.ts';

export type MediaPlaybackAuxProps = {
  runtime: t.DevPlaybackRuntime;
  theme: t.CommonTheme;
};

/**
 * Component:
 */
export const MediaPlaybackAux: React.FC<MediaPlaybackAuxProps> = (props) => {
  const { theme, runtime } = props;

  return (
    <div>
      <Player.Video.Decks.UI
        decks={runtime.decks}
        active={runtime.snapshot.state.decks.active}
        show={'both'}
        aspectRatio={'4/3'}
        gap={20}
        style={{ Margin: [10, 20, 15, 20] }}
      />
      <KeyValue.UI
        theme={theme}
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

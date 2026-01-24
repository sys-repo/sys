import React from 'react';
import { type t, Color, css, D, usePlayerSignals, VideoElement } from './common.ts';

export const VideoDecks: React.FC<t.VideoDecksProps> = (props) => {
  const {
    debug = false,
    decks,
    active = D.active,
    aspectRatio = D.aspectRatio,
    muted = D.muted,
    show = D.show,
    gap = D.gap,
  } = props;

  const theme = Color.theme(props.theme);

  // Hooks MUST be called unconditionally and in stable order.
  const ctrlA = usePlayerSignals(decks?.A, { log: debug });
  const ctrlB = usePlayerSignals(decks?.B, { log: debug });

  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      position: show === 'single' ? 'relative' : undefined,
      display: 'grid',
      width: '100%',
      height: '100%',
      minWidth: 0,
      minHeight: 0,
    }),

    both: css({
      gridTemplateColumns: '1fr 1fr',
      gap,
      alignItems: 'stretch',
    }),

    layer: css({
      position: 'absolute',
      inset: 0,
      display: 'grid',
      minWidth: 0,
      minHeight: 0,
    }),

    deck: css({
      display: 'grid',
      width: '100%',
      height: '100%',
      minWidth: 0,
      minHeight: 0,
    }),

    inactive: css({
      opacity: 0.25,
      pointerEvents: 'none',
    }),
  } as const;

  function renderVideo(deck: 'A' | 'B', controller: ReturnType<typeof usePlayerSignals>) {
    const isActive = active === deck;
    if (!controller?.props?.src) return null;

    const deckMuted = muted === false ? false : !isActive;

    return (
      <div className={css(styles.deck, !isActive && styles.inactive).class}>
        <VideoElement
          {...controller.props}
          debug={debug}
          theme={props.theme}
          interaction={{ clickToPlay: false }}
          aspectRatio={aspectRatio}
          muted={deckMuted}
        />
      </div>
    );
  }

  const elA = renderVideo('A', ctrlA);
  const elB = renderVideo('B', ctrlB);

  if (show === 'single') {
    // Active fills, inactive behind.
    const front = active === 'A' ? elA : elB;
    const back = active === 'A' ? elB : elA;

    return (
      <div className={css(styles.base, props.style).class}>
        <div className={styles.layer.class}>{back}</div>
        <div className={styles.layer.class}>{front}</div>
      </div>
    );
  }

  // show === 'both'
  return (
    <div className={css(styles.base, styles.both, props.style).class}>
      {elA}
      {elB}
    </div>
  );
};

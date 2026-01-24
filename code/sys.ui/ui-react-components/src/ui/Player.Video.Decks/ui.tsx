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

  // Hooks: stable order, always called.
  const ctrlA = usePlayerSignals(decks?.A, { log: debug });
  const ctrlB = usePlayerSignals(decks?.B, { log: debug });

  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,

      display: 'grid',
      width: '100%',
      height: '100%',

      // Critical inside other grids/flex:
      minWidth: 0,
      minHeight: 0,
      placeSelf: 'stretch',

      // Ensure children can stretch:
      alignItems: 'stretch',
      justifyItems: 'stretch',
      alignContent: 'stretch',
      justifyContent: 'stretch',
    }),

    both: css({
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr',
      gap,
    }),

    single: css({
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
    }),

    // Both decks sit in the same cell when show='single'.
    cell: css({
      gridColumn: '1',
      gridRow: '1',
      width: '100%',
      height: '100%',
      minWidth: 0,
      minHeight: 0,
      display: 'grid',
      alignItems: 'stretch',
      justifyItems: 'stretch',
    }),

    // Visual policy only (doesn't affect layout).
    inactive: css({
      opacity: 0.25,
      pointerEvents: 'none',
    }),
  } as const;

  function renderDeck(deck: 'A' | 'B', ctrl: typeof ctrlA, isStacked: boolean) {
    if (!ctrl?.props?.src) return null;

    const isActive = active === deck;
    const deckMuted = muted === false ? false : !isActive;

    const wrapClass = css(
      styles.cell,
      !isActive && styles.inactive,
      isStacked && isActive ? css({ zIndex: 2 }) : undefined,
      isStacked && !isActive ? css({ zIndex: 1 }) : undefined,
    ).class;

    return (
      <div className={wrapClass}>
        <VideoElement
          {...ctrl.props}
          debug={debug}
          theme={props.theme}
          interaction={{ clickToPlay: false }}
          aspectRatio={aspectRatio}
          muted={deckMuted}
        />
      </div>
    );
  }

  const isStacked = show === 'single';
  const layout = isStacked ? styles.single : styles.both;

  return (
    <div className={css(styles.base, layout, props.style).class}>
      {isStacked ? (
        <>
          {renderDeck('A', ctrlA, true)}
          {renderDeck('B', ctrlB, true)}
        </>
      ) : (
        <>
          <div className={styles.cell.class}>{renderDeck('A', ctrlA, false)}</div>
          <div className={styles.cell.class}>{renderDeck('B', ctrlB, false)}</div>
        </>
      )}
    </div>
  );
};

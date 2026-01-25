import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { Deck } from './ui.Deck.tsx';

export const VideoDecks: React.FC<t.VideoDecksProps> = (props) => {
  const { debug = false, show = D.show, gap = D.gap } = props;

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      minWidth: 0,
      minHeight: 0,
    }),

    layoutBoth: css({
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr',
      gap,
      alignItems: 'stretch',
      justifyItems: 'stretch',
    }),

    layoutSingle: css({
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
      alignItems: 'stretch',
      justifyItems: 'stretch',
    }),
  } as const;

  const layout = show === 'single' ? css(styles.layoutSingle) : css(styles.layoutBoth);

  return (
    <div className={css(styles.base, layout, props.style).class}>
      <Deck deck={'A'} parent={props} />
      <Deck deck={'B'} parent={props} />
    </div>
  );
};

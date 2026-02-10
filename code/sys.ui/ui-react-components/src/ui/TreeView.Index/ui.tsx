import React from 'react';

import { type t, Color, css, D } from './common.ts';
import { SlideDeck } from './u.SlideDeck.tsx';
import { renderItems } from './ui.items.tsx';
import { Spinning } from './ui.Spinning.tsx';
import { usePropsNormalizer } from './use.PropsNormalizer.ts';

export const IndexTreeView: React.FC<t.IndexTreeViewProps> = (props) => {
  const { debug = false, minWidth, spinning = false } = props;
  const { leaf, effective, animKey, dir } = usePropsNormalizer(props);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, minHeight: 0, height: '100%', display: 'grid' }),
    spinning: css({ Absolute: 0 }),
    body: css({
      minWidth: minWidth ?? D.minWidth,
      minHeight: 0,
      height: '100%',
      display: 'grid',
      pointerEvents: spinning ? 'none' : 'auto',
      filter: `blur(${spinning ? 0.8 : 0}px)`,
      opacity: spinning ? 0.06 : 1,
      transition: 'opacity 120ms ease',
    }),
    leafViewport: css({
      minHeight: 0,
      height: '100%',
      display: 'grid',
      gridTemplateRows: 'minmax(0, 1fr)',
    }),
  };

  const elLeaf = leaf && <div className={styles.leafViewport.class}>{leaf}</div>;
  const elItems = !leaf && renderItems(props, effective.view);

  return (
    <div className={css(styles.base, props.style).class}>
      <SlideDeck
        keyId={animKey}
        direction={dir}
        style={styles.body}
        duration={props.slideDuration}
        offset={props.slideOffset}
      >
        {leaf ? elLeaf : elItems}
      </SlideDeck>
      {spinning && <Spinning theme={theme.name} style={styles.spinning} />}
    </div>
  );
};

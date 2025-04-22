import React, { useEffect, useState } from 'react';
import { type t, css, D, ReactChildren } from './common.ts';
import { Item } from './ui.Item.tsx';

type S = { key: string; children: t.ReactNode };

export const FadeElement: React.FC<t.FadeElementProps> = (props) => {
  const { children, duration = D.duration, style } = props;

  // Keep current & previous references to unique keys can be generated.
  const [curr, setCurr] = useState<S>({ key: ReactChildren.deps(children), children });
  const [prev, setPrev] = useState<S>();

  /**
   * Effect: Manage cross-fade.
   */
  useEffect(() => {
    const key = ReactChildren.deps(children);
    if (key === curr.key) return;

    setPrev(curr);
    setCurr({ key, children });
  }, [children, duration, curr]);

  /**
   * Render:
   */
  const styles = {
    base: css({
      display: 'grid',
      gridTemplateRows: 'auto',
      gridTemplateColumns: 'auto',
      placeItems: 'center',
    }),
    item: css({
      // NB: CSS Grid stacking (so both items sit atop each other).
      gridRow: '1 / 2',
      gridColumn: '1 / 2',
      display: 'grid',
      placeItems: 'center',
    }),
  };

  const elPrev = prev && (
    <Item
      key={`prev-${prev.key}`}
      duration={duration}
      show={false}
      style={styles.item}
      children={prev.children}
      onTransitionEnd={() => setPrev(undefined)}
    />
  );

  const elCurrent = (
    <Item
      key={`curr-${curr.key}`}
      duration={duration}
      show={true}
      style={styles.item}
      children={curr.children}
    />
  );

  return (
    <div className={css(styles.base, style).class}>
      {elPrev}
      {elCurrent}
    </div>
  );
};

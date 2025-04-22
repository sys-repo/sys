import React, { useEffect, useRef, useState } from 'react';
import { type t, css, D, ReactChildren, Time } from './common.ts';
import { Item } from './ui.Item.tsx';

export const FadeElement: React.FC<t.FadeElementProps> = (props) => {
  const { duration = D.duration, children } = props;

  const [items, setItems] = useState<t.FadeElementItem[]>([toItem(0, children)]);
  const nextRef = useRef(1);

  /**
   * Effect:
   */
  const deps = ReactChildren.useDeps(children);
  useEffect(() => {
    setItems((prev) => {
      const last = prev[prev.length - 1];
      const isSame = prev.length && last.key === ReactChildren.deps(props.children);

      // If the latest item is already showing, do nothing.
      if (isSame) return prev;

      // Mark all existing items as fading out.
      const updated: t.FadeElementItem[] = prev.map((item) => ({ ...item, fadingOut: true }));

      // Add the new item with a unique-id.
      return [...updated, toItem(nextRef.current++, children)];
    });

    // Schedule removal of items that have faded out.
    const time = Time.until();
    time.delay(duration, () => setItems((prev) => prev.filter((item) => !item.fadingOut)));
    return time.dispose;
  }, [deps]);

  /**
   * Render:
   */
  const styles = {
    base: css({ position: 'relative', display: 'grid' }),
    item: css({ Absolute: 0 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {items.map((item) => {
        return <Item key={item.id} item={item} duration={duration} style={styles.item} />;
      })}
    </div>
  );
};

/**
 * Helpers:
 */
const toItem = (id: number, children: t.ReactNode): t.FadeElementItem => {
  const key = ReactChildren.deps(children);
  return { id, children, key, fadingOut: false };
};

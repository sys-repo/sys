import React, { useEffect, useState } from 'react';
import { type t, css, ReactString, Time } from './common.ts';

export type ItemProps = {
  item: t.FadeElementItem;
  duration: number;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Item: React.FC<ItemProps> = (props) => {
  const { item, duration } = props;
  const [visible, setVisible] = useState<boolean>(false);

  /**
   * Effect: fade-out
   */
  useEffect(() => {
    if (!item.fadingOut) {
      const time = Time.until();
      time.delay(0, () => setVisible(true));
      return time.dispose;
    }
  }, [item.fadingOut]);

  /**
   * Effect: When the item is marked as fading out, update the visible flag.
   */
  useEffect(() => {
    if (item.fadingOut) setVisible(false);
  }, [item.fadingOut]);

  /**
   * Render:
   */
  const styles = {
    base: css({ display: 'grid', placeItems: 'center' }),
    body: css({ transition: `opacity ${duration}ms`, opacity: visible ? 1 : 0 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{ReactString.break(item.text)}</div>
    </div>
  );
};

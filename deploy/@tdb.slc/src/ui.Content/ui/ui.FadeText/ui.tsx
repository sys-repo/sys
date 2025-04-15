import React, { useEffect, useRef, useState } from 'react';
import { Color, css, D, Time, type t } from './common.ts';
import { Item, type FadeItem } from './ui.Item.tsx';

export const FadeText: React.FC<t.FadeTextProps> = (props) => {
  const {
    text = '',
    fontSize = D.fontSize,
    fontWeight = D.fontWeight,
    letterSpacing = D.letterSpacing,
    lineHeight = D.lineHeight,
    duration = D.duration,
  } = props;

  const [items, setItems] = useState<FadeItem[]>([{ id: 0, text, fadingOut: false }]);
  const next = useRef(1);

  /**
   * Effect:
   */
  useEffect(() => {
    setItems((prev) => {
      if (prev.length && prev[prev.length - 1].text === text) return prev; // ← If the latest item already shows the same text, do nothing.
      const updated = prev.map((item) => ({ ...item, fadingOut: true })); //  ← Mark all existing items as fading out.
      return [...updated, { id: next.current++, text, fadingOut: false }]; // ← Add the new text item with a unique id.
    });

    // Schedule removal of items that have faded out.
    const time = Time.until();
    time.delay(duration, () => setItems((prev) => prev.filter((item) => !item.fadingOut)));
    return time.dispose;
  }, [text, duration]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const color = theme.fg;
  const styles = {
    base: css({ position: 'relative' }),
    item: css({ Absolute: 0, color, fontSize, fontWeight, letterSpacing, lineHeight }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {items.map((item) => {
        return <Item key={item.id} item={item} duration={duration} style={styles.item} />;
      })}
    </div>
  );
};

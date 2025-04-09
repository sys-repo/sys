import React, { useState, useEffect } from 'react';
import { type t, Color, css, LogoCanvas, LogoWordmark, Time } from '../common.ts';

export type BodyProps = {
  selected?: t.CanvasPanel | t.CanvasPanel[];
  showLogo?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

type P = BodyProps;

export const Body: React.FC<P> = (props) => {
  const { selected, showLogo = false } = props;
  const [currentSelected, setCurrentSelected] = useState<t.CanvasPanel>();

  /**
   * Effect:
   */
  useEffect(() => {
    const time = Time.until();
    async function animateSelected(list: t.CanvasPanel[]) {
      for (const value of list) {
        if (time.disposed) break;
        setCurrentSelected(value);
        await time.wait(200);
      }
    }

    if (Array.isArray(selected)) animateSelected(selected);
    else setCurrentSelected(selected);

    return time.dispose;
  }, [wrangle.selected(props).join(':')]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', display: 'grid', placeItems: 'center' }),
    body: css({ display: 'grid', placeItems: 'center', rowGap: '40px' }),
    canvas: css({ MarginX: 60 }),
    logo: css({
      width: 130,
      MarginX: 40,
      opacity: showLogo ? 1 : 0,
      transition: 'opacity 300ms',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <LogoCanvas theme={theme.name} style={styles.canvas} selected={currentSelected} />
        <LogoWordmark theme={theme.name} style={styles.logo} />
      </div>
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  selected(props: P): t.CanvasPanel[] {
    const { selected } = props;
    if (!selected) return [];
    return Array.isArray(selected) ? selected : [selected];
  },
} as const;

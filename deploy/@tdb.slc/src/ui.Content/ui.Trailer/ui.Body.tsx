import React from 'react';
import { type t, Color, css, LogoCanvas, LogoWordmark } from '../common.ts';

export type BodyProps = {
  selected?: t.CanvasPanel | t.CanvasPanel[];
  showLogo?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

type P = BodyProps;

export const Body: React.FC<P> = (props) => {
  const { showLogo = false } = props;

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
        <LogoCanvas theme={theme.name} style={styles.canvas} selected={props.selected} />
        <LogoWordmark theme={theme.name} style={styles.logo} />
      </div>
    </div>
  );
};

import React from 'react';
import { type t, Color, Cropmarks, css } from './common.ts';

export type LayoutDesktopProps = {
  ctx?: { dist?: t.DistPkg; stage?: t.Stage };
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const LayoutDesktop: React.FC<LayoutDesktopProps> = (props) => {
  const { ctx } = props;
  console.log('ctx', ctx);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={props.theme} borderOpacity={0.05}>
        <div>{`🐷 Layout: Desktop`}</div>
      </Cropmarks>
    </div>
  );
};

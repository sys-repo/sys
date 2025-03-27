import React from 'react';
import { type t, Color, Cropmarks, css } from './common.ts';

export type LayoutIntermediateProps = {
  dist?: t.DistPkg;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const LayoutIntermediate: React.FC<LayoutIntermediateProps> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={props.theme}>
        <div>{`🐷 Layout: Intermediate`}</div>
      </Cropmarks>
    </div>
  );
};

import { useEffect, useRef, useState } from 'react';
import { Color, css, FC, rx, type t } from '../../ui/common.ts';

export type AppProps = {
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

export const App: React.FC<AppProps> = (props) => {
  const {} = props;

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
    }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <div>{`🐷 Sample`}</div>
    </div>
  );
};

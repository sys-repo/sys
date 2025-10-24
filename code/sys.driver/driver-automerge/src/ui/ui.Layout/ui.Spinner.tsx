import React from 'react';
import { type t, css, Spinners } from './common.ts';

export type SpinnerProps = {
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Spinner: React.FC<SpinnerProps> = (props) => {
  const styles = {
    base: css({
      Absolute: 0,
      display: 'grid',
      placeItems: 'center',
    }),
  };
  return (
    <div className={css(styles.base, props.style).class}>
      <Spinners.Bar theme={props.theme} />
    </div>
  );
};

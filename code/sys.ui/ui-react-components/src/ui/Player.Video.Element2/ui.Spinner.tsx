import React from 'react';
import { type t, BarSpinner, Color, css } from './common.ts';

export type NotReadySpinnerProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const NotReadySpinner: React.FC<NotReadySpinnerProps> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <BarSpinner theme={theme.name} />
    </div>
  );
};

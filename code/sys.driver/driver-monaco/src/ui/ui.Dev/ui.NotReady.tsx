import React from 'react';
import { type t, Color, css } from './common.ts';

export type NotReadyProps = {
  children?: t.ReactNode;
  label?: string;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const NotReady: React.FC<NotReadyProps> = (props) => {
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
    body: css({ opacity: 0.4 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        {props.children}
        {props.label}
      </div>
    </div>
  );
};

import React from 'react';
import { type t, Color, css } from './common.ts';

export type RuntimeErrorProps = {
  title?: string;
  message?: string;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const RuntimeError: React.FC<RuntimeErrorProps> = (props) => {
  const { title = 'Error', message = '<none>' } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid', placeItems: 'center' }),
    error: css({ color: Color.YELLOW, fontWeight: 'bold', fontSize: 20 }),
    title: css({ opacity: 0.4 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.error.class}>
        <span className={styles.title.class}>{`${title}:`}</span> <span>{message}</span>
      </div>
    </div>
  );
};

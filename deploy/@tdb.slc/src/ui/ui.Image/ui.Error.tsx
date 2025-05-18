import React from 'react';
import { type t, Color, css, Icons } from './common.ts';

export type ErrorMessage = {
  src?: string;
  theme?: t.CommonTheme;
  opacity?: t.Percent;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const ErrorMessage: React.FC<ErrorMessage> = (props) => {
  const { opacity = 0.6, src = '<src:unknown>' } = props;

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
    body: css({ display: 'grid', placeItems: 'center', rowGap: '12px' }),
    msg: css({ fontSize: 11, opacity }),
    err: css({ color: Color.MAGENTA }),
    src: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <Icons.Sad size={38} />
        <div className={styles.msg.class}>
          <span className={styles.err.class}>{`failed to load:`}</span>{' '}
          <span className={styles.src.class}>{src}</span>
        </div>
      </div>
    </div>
  );
};

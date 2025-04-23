import React from 'react';
import { type t, Color, css, D } from './common.ts';

export const Bullet: React.FC<t.BulletProps> = (props) => {
  const {} = props;
  const Size = props.size ?? D.size;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      Size,
      position: 'relative',
      display: 'grid',
    }),
    body: css({
      borderRadius: Size,
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}></div>
    </div>
  );
};

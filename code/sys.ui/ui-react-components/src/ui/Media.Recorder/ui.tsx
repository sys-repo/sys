import React from 'react';
import { type t, Color, css, D } from './common.ts';

export const MediaRecorder: React.FC<t.MediaRecorderProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
      padding: 10,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 ${D.name}`}</div>
    </div>
  );
};

import React from 'react';
import { type t, IFrame, Color, css, D } from './common.ts';

export const YouTube: React.FC<t.YouTubeProps> = (props) => {
  const {
    //
    debug = false,
    videoId,
    width = D.width,
    height = D.height,
  } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      position: 'relative',
      width,
      height,
      display: 'grid',
    }),
  };

  const allow = `accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture`;
  const src = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className={css(styles.base, props.style).class}>
      <IFrame width={width} height={height} src={src} allow={allow} allowFullScreen />
    </div>
  );
};

import React from 'react';
import { type t, Color, css, VideoPlayer } from './common.ts';

export const ConceptPlayer: React.FC<t.ConceptPlayerProps> = (props) => {
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
    <div className={css(styles.base, props.style).class}>
      <VideoPlayer title={props.title} video={props.video} />
    </div>
  );
};

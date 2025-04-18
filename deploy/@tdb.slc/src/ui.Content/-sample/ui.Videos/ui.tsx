import React from 'react';
import { type t, Color, css, Player } from './common.ts';

export const VideosIndex: React.FC<t.VideosIndexProps> = (props) => {
  const {} = props;
  const signalsRef = React.useRef(props.signals);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      width: 688,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Player.Video.View signals={signalsRef.current} />
    </div>
  );
};

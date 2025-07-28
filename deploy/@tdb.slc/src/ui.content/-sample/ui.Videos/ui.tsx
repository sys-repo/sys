import React from 'react';
import { type t, Color, css, Player } from './common.ts';

export const VideosIndex: React.FC<t.VideosIndexProps> = (props) => {
  const {} = props;
  const controller = Player.Video.useSignals(props.signals);

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
      <Player.Video.Element {...controller.props} />
    </div>
  );
};

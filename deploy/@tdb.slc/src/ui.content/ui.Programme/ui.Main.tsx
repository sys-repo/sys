import React from 'react';
import { type t, Color, css, ElapsedTime, ObjectView, useTimestamps } from './common.ts';

export type MainProps = {
  debug?: boolean;
  timestamps?: t.ContentTimestamps;
  player?: t.VideoPlayerSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Main: React.FC<MainProps> = (props) => {
  const { player, debug = false } = props;
  const timestamp = useTimestamps(player, props.timestamps);


  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      padding: 30,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>
      </div>

      <ElapsedTime player={player} abs={true} show={debug} />
    </div>
  );
};

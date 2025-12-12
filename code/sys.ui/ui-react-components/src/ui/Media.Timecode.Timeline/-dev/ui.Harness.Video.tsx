import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, Rx, Obj, Str, Is, Cropmarks, Player } from './common.ts';

export type HarnessVideoProps = {
  debug?: boolean;
  video?: t.VideoPlayerSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Video: React.FC<HarnessVideoProps> = (props) => {
  const { debug = false, video } = props;

  /**
   * Behavior/State (hooks):
   */
  const controller = Player.Video.useSignals(video, { log: debug });
  if (!controller.props.src) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.03}>
        <Player.Video.Element
          style={{ width: 420 }}
          debug={debug}
          theme={props.theme}
          {...controller.props}
        />
      </Cropmarks>
    </div>
  );
};

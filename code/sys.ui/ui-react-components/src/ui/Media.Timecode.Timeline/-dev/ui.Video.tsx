import React from 'react';
import { type t, dur, Is, Signal, Color, Cropmarks, css, Player } from './common.ts';

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

  console.log('video', video);
  console.log('videl', Signal.toObject(video?.props));

  /**
   * Hooks:
   */
  const controller = Player.Video.useSignals(video, { log: debug });
  if (!controller.props.src) return null;
  if (!video) return null;

  const p = video.props;

  let dms = Is.num(p.duration.value) ? p.duration.value * 1000 : 0;

  const info = `slice: ${p.slice.value || '-'}, duration: ${dur(dms)}`;

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
    body: css({
      position: 'relative',
    }),
    label: css({
      Absolute: [null, 0, -20, 5],
      fontFamily: 'monospace',
      fontSize: 9,
    }),
  };

  const elBody = (
    <div>
      <Player.Video.Element
        style={{ width: 420 }}
        debug={debug}
        theme={props.theme}
        muted={true} // TEMP 🐷
        {...controller.props}
      />
      <div className={styles.label.class}>{info}</div>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.03}>
        {elBody}
      </Cropmarks>
    </div>
  );
};

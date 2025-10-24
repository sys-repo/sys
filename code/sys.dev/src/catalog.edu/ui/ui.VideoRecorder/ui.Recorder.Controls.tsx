import React from 'react';
import { type t, Color, css, D, Media, RecorderHookView, Time } from './common.ts';
import { TitleBar } from './ui.TitleBar.tsx';

export type RecorderControlsProps = {
  signals?: t.VideoRecorderViewSignals;
  title?: string;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onStatusChange?: (e: t.MediaRecorderStatus) => void;
};
type P = RecorderControlsProps;

/**
 * Component:
 */
export const RecorderControls: React.FC<P> = (props) => {
  const { debug = false, signals, title = 'Recorder', onStatusChange } = props;
  const stream = signals?.stream.value;
  const { mimeType, videoBitsPerSecond, audioBitsPerSecond } = wrangle.config(signals);

  /**
   * Hooks:
   */
  const recorder = Media.Recorder.UI.useRecorder(stream, {
    mimeType,
    videoBitsPerSecond,
    audioBitsPerSecond,
    onStatusChange,
  });
  const elapsed = recorder.elapsed;
  const elapsedOut = elapsed < 1000 ? `-` : Time.duration(elapsed).toString();

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      userSelect: 'none',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
    recorder: css({ MarginX: 20, MarginY: 15 }),
    right: css({ fontSize: 11 }),
  };

  const elRight = <div className={styles.right.class}>{elapsed > 0 ? elapsedOut : null}</div>;

  return (
    <div className={css(styles.base, props.style).class}>
      <TitleBar left={title} right={elRight} theme={theme.name} />
      <RecorderHookView theme={theme.name} recorder={recorder} style={styles.recorder} />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  config(signals?: t.VideoRecorderViewSignals): Required<t.VideoRecorderConfig> {
    const c = signals?.config.value;
    const mimeType = c?.mimeType ?? D.config.mimeType;
    const videoBitsPerSecond = c?.videoBitsPerSecond ?? D.config.videoBitsPerSecond;
    const audioBitsPerSecond = c?.audioBitsPerSecond ?? D.config.audioBitsPerSecond;
    return { mimeType, videoBitsPerSecond, audioBitsPerSecond };
  },
} as const;

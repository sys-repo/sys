import React from 'react';
import { type t, Color, css, Media, RecorderHookView, Time } from '../common.ts';
import { TitleBar } from './ui.TitleBar.tsx';

export type RecorderControlsProps = {
  title?: string;
  stream?: MediaStream;
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
  const { debug = false, stream, title = 'Recorder', onStatusChange } = props;

  /**
   * Hooks:
   */
  const recorder = Media.Recorder.UI.useRecorder(stream, { videoBitsPerSecond, onStatusChange });
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
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <TitleBar left={title} right={elapsed > 0 ? elapsedOut : null} theme={theme.name} />
      <RecorderHookView theme={theme.name} recorder={recorder} style={styles.recorder} />
    </div>
  );
};

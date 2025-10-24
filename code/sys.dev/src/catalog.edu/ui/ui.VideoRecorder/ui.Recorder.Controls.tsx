import React from 'react';
import { type t, Color, css, Media, RecorderHookView, Time } from '../common.ts';

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

  // TEMP 🐷 - get from YAML config?
  const videoBitsPerSecond = 10_000_000; // 10-Mbps

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
    base: css({ backgroundColor: Color.ruby(debug), color: theme.fg, display: 'grid' }),
    title: {
      base: css({
        Padding: [5, 12, 5, 8],
        backgroundColor: Color.alpha(theme.fg, 0.06),
        borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.2)}`,
        fontSize: 13,
        lineHeight: 1.2,
        marginBottom: 5,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
      }),
    },
    recorder: css({ MarginX: 20, MarginY: [10, 15] }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.base.class}>
        <div>{title}</div>
        <div />
        <div>{elapsed > 0 ? elapsedOut : null}</div>
      </div>
      <RecorderHookView theme={theme.name} recorder={recorder} style={styles.recorder} />
    </div>
  );
};

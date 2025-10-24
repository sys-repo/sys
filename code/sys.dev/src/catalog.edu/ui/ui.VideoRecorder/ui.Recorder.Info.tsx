import React from 'react';
import { type t, css, Is, KeyValue, Media, Num, Signal } from './common.ts';

export type InfoProps = {
  signals?: t.VideoRecorderViewSignals;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Info: React.FC<InfoProps> = (props) => {
  const { debug = false, signals } = props;
  const [items, setItems] = React.useState<t.KeyValueItem[]>([]);

  Signal.useEffect(() => {
    const status = signals?.recorder.value;
    const stream = signals?.stream.value;
    setItems(wrangle.stats(status, stream));
  });

  /**
   * Render:
   */
  const styles = {
    base: css({ display: 'grid' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.View theme={props.theme} items={items} />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  stats(status?: t.MediaRecorderStatus, stream?: MediaStream): t.KeyValueItem[] {
    if (!status) return [];

    const items: t.KeyValueItem[] = [];
    const capture = stream ? Media.Recorder.captureInfo(stream) : status.capture;
    const { width, height } = capture;

    const num = (value: number): string => value.toLocaleString();
    const bits = status.bitrate;
    const video = num(bits.video / 1_000_000);
    const audio = num(bits.audio / 1_000);
    const screen = Is.num(width) && Is.num(height) ? `${width} x ${height}` : '-';
    const aspectRatio = capture.aspectRatio ? Num.round(capture.aspectRatio, 2) : '-';
    const fps = status.capture.frameRate;

    items.push({ kind: 'title', v: 'MediaRecorder' });
    items.push({ k: 'frame rate', v: Is.num(fps) ? `${fps} fps` : '-' });
    items.push({ k: 'screen size', v: screen });
    items.push({ k: 'aspect ratio', v: aspectRatio });
    items.push({ kind: 'hr' });
    items.push({ k: 'bitrate:' });
    items.push({ k: '- video', v: `${video} Mbps`, x: [10, 0] });
    items.push({ k: '- audio', v: `${audio} kbps`, x: [10, 0] });

    return items;
  },
} as const;

import React from 'react';
import { type t, css, Is, KeyValue, Media, Num, Signal } from './common.ts';

export type RecorderInfoProps = {
  signals?: t.VideoRecorderViewSignals;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const RecorderInfo: React.FC<RecorderInfoProps> = (props) => {
  const { debug = false, signals } = props;
  const [items, setItems] = React.useState<t.KeyValueItem[]>([]);

  Signal.useEffect(() => {
    const status = signals?.recorder.value;
    const stream = signals?.stream.value;
    setItems(wrangle.stats({ status, stream }));
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
  stats(args: { status?: t.MediaRecorderStatus; stream?: MediaStream }): t.KeyValueItem[] {
    const { status, stream } = args;
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
    const mime = status.mimeType;
    const encoding = mime ? mime.split(';').join('; ') : '';

    const indent = [12, 0] as const;

    items.push({ kind: 'title', v: 'Stream' });
    items.push({ k: 'frame rate', v: Is.num(fps) ? `${fps} fps` : '-', x: indent });
    items.push({ k: 'screen size', v: screen, x: indent });
    items.push({ k: 'aspect ratio', v: aspectRatio, x: indent });
    items.push({ kind: 'hr' });
    items.push({ kind: 'title', v: 'Quality' });
    items.push({ k: 'video bitrate', v: `${video} Mbps`, x: indent });
    items.push({ k: 'audio bitrate', v: `${audio} kbps`, x: indent });
    items.push({ k: 'encoding', v: `${encoding || '-'}`, x: indent });

    return items;
  },
} as const;

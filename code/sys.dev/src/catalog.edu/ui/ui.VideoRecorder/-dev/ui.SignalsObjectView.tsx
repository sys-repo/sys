import React from 'react';
import { type t, Color, css, Media, Obj, ObjectView } from '../common.ts';

export type SignalsObjectViewProps = Pick<t.ObjectViewProps, 'expand' | 'name'> & {
  signals?: t.VideoRecorderViewSignals;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const SignalsObjectView: React.FC<SignalsObjectViewProps> = (props) => {
  const { debug = false, signals, name = 'signals' } = props;
  const stream = signals?.stream.value;
  const field = {
    camera: mediaField('camera:device', signals?.camera?.value),
    audio: mediaField('audio:device', signals?.audio?.value),
  };

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
      <ObjectView
        theme={theme.name}
        name={name}
        data={{
          [field.camera.label]: field.camera.value,
          [field.audio.label]: field.audio.value,
          stream: Info.stream(stream),
        }}
        style={{ marginTop: 5 }}
        expand={1}
      />
    </div>
  );
};

/**
 * Helpers:
 */
function mediaField(labelPrefix?: string, info?: MediaDeviceInfo) {
  let label = `${labelPrefix}`;
  if (info?.deviceId) label = `${label}:#${info.deviceId.slice(0, 4)}`;
  return { label, value: Obj.trimStringsDeep(Media.toObject(info), 15) };
}

const Info = {
  /**
   * Return a compact identifier for a MediaStream,
   * including associated audio/video device IDs.
   */
  stream(stream?: MediaStream) {
    if (!stream) return undefined;

    const tracks = stream.getTracks();
    if (tracks.length === 0) {
      return { id: 'none', kind: 'none' };
    }

    const kinds = [...new Set(tracks.map((t) => t.kind))];
    const kind = kinds.join('+'); // "video", "audio", or "audio+video"
    const shorten = (id: string = '', amount = 5) => {
      return id.length > 10 ? `${id.slice(0, amount)}..${id.slice(-amount)}` : id;
    };

    // Extract device-IDs when available.
    const videoTrack = tracks.find((t) => t.kind === 'video');
    const audioTrack = tracks.find((t) => t.kind === 'audio');

    const cameraId = videoTrack?.getSettings()?.deviceId;
    const micId = audioTrack?.getSettings()?.deviceId;

    return {
      kind,
      id: `stream:${shorten(stream.id, 8)}`,
      'id:camera': shorten(cameraId),
      'id:audio': shorten(micId),
    };
  },
} as const;

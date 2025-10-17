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
  return { label, value: simplifyDeviceInfo(info) };
}

function simplifyDeviceInfo(device?: MediaDeviceInfo) {
  if (!device) return;
  return Obj.trimStringsDeep(
    {
      deviceId: device.deviceId,
      kind: device.kind,
      label: device.label,
      groupId: device.groupId,
    },
    20,
  );
}

import React from 'react';
import { type t, Media } from './common.ts';

type P = {
  base: t.VideoRecorderViewProps;
  kind: MediaDeviceInfo['kind'];
  signal?: t.Signal<MediaDeviceInfo | undefined>;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const ConfigDevices: React.FC<P> = (props) => {
  const { signal, base } = props;
  const { debug = false } = base;

  const filter: t.MediaDevicesFilter = (e) => e.kind === props.kind;
  const storageKey = wrangle.storageKey(props);

  /**
   * Hooks:
   */
  const [items, setItems] = React.useState<MediaDeviceInfo[]>([]);
  Media.Devices.useDeviceSelectionLifecycle({
    items,
    storageKey,
    prefs: { kindOrder: ['videoinput', 'audioinput', 'audiooutput'], requireLabel: true },
    selected: signal?.value,
    onResolve: (e) => {
      if (signal) signal.value = e.device;
    },
  });

  /**
   * Render:
   */
  return (
    <Media.Devices.UI.List
      style={props.style}
      theme={base.theme}
      debug={debug}
      filter={filter}
      selected={signal?.value}
      onSelect={(e) => {
        if (signal) signal.value = e.device;
      }}
      onDevicesChange={(e) => {
        console.info(`⚡️ List.onDevicesChange:`, e);
        setItems(e.devices);
      }}
    />
  );
};

/**
 * Helpers:
 */
const wrangle = {
  storageKey(props: P) {
    const { kind, base } = props;
    const key = base.crdt?.storageKey;
    return key ? `${key}:devices.${kind}` : undefined;
  },
} as const;

import React from 'react';
import { type t, D } from '../common.ts';
import { Devices } from '../mod.ts';

type Base = t.MediaDevicesProps;

export type StatefulDeviceListProps = {
  storageKey: string;
  filter?: t.MediaDevicesFilter;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
} & {
  onSelect?: Base['onSelect'];
  onDevicesChange?: Base['onDevicesChange'];
};

/**
 * Uncontrolled wrapper around `Devices.UI.List`.
 * - Tracks selection locally and persists via `storageKey`.
 * - Seeds from storage on mount (emits via `onSelect`).
 */
export const StatefulDeviceList: React.FC<StatefulDeviceListProps> = (props) => {
  const { debug = false, storageKey } = props;

  /**
   * Hooks:
   */
  const [items, setItems] = React.useState<MediaDeviceInfo[]>([]);
  const [selected, setSelected] = React.useState<MediaDeviceInfo | undefined>(undefined);

  /**
   * Selection lifecycle over current items:
   */
  Devices.useDeviceSelectionLifecycle({
    items,
    selected,
    storageKey,
    onResolve: (e) => {
      setSelected(e.device);
      props.onSelect?.(e);
    },
  });

  /**
   * Render:
   */
  return (
    <Devices.UI.List
      style={props.style}
      debug={debug}
      theme={props.theme}
      filter={props.filter}
      selected={selected}
      onSelect={(e) => {
        setSelected(e.device);
        props.onSelect?.(e);
      }}
      onDevicesChange={(e) => {
        setItems(e.devices);
        props.onDevicesChange?.(e);
      }}
    />
  );
};

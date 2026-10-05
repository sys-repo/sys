import React from 'react';

import { type t, Color, css, D, Spinners } from './common.ts';
import { Row } from './ui.Row.tsx';
import { useDevicesList } from './use.DevicesList.ts';

type P = t.MediaDevicesProps;

export const List: React.FC<P> = (props) => {
  const { debug = false, rowGap = D.rowGap } = props;

  /**
   * Hooks:
   */
  const devices = useDevicesList();

  // Visible list (filtered):
  const visible = React.useMemo(
    () => devices.items.filter((d) => props.filter?.(d) ?? true),
    [devices.items, props.filter],
  );

  // Lightweight content signatures (kind:deviceId) → detect real changes:
  const idOf = (d: MediaDeviceInfo) => `${d.kind}:${d.deviceId || '(none)'}`;
  const visibleSig = React.useMemo(() => visible.map(idOf).join('|'), [visible]);
  const allSig = React.useMemo(() => devices.items.map(idOf).join('|'), [devices.items]);

  /**
   * Effect: notify caller only when content changes.
   * Keeps the parent simple: onDevicesChange={(e) => setItems(e.devices)} or e.all
   */
  const prevSigRef = React.useRef<string>('');
  React.useEffect(() => {
    if (!props.onDevicesChange) return;
    const sig = `${visibleSig}||${allSig}`;
    if (sig === prevSigRef.current) return; // no real change
    prevSigRef.current = sig;

    props.onDevicesChange({
      devices: visible, //    filtered (what is rendered)
      all: devices.items, //  raw
      filtered: visible.length !== devices.items.length,
    });
  }, [props.onDevicesChange, visibleSig, allSig, visible, devices.items]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid', rowGap }),
    empty: css({ padding: 10, placeItems: 'center' }),
  };

  const elEmpty = visible.length === 0 && (
    <div className={styles.empty.class}>
      <Spinners.Bar theme={theme.name} />
    </div>
  );

  const elItems = visible.map((item, i) => (
    <Row
      key={wrangle.key(item)}
      device={item}
      debug={debug}
      index={i}
      selected={wrangle.selected(props, item)}
      theme={theme.name}
      onSelect={props.onSelect}
    />
  ));

  return (
    <div className={css(styles.base, props.style).class}>
      {elItems}
      {elEmpty}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  key(d: MediaDeviceInfo) {
    return `${d.kind}:${d.deviceId || '(none)'}`;
  },
  selected(props: P, item: MediaDeviceInfo): boolean {
    const sel = props.selected;
    if (!sel) return false;
    const a = `${sel.kind}:${sel.deviceId || '(none)'}`;
    const b = `${item.kind}:${item.deviceId || '(none)'}`;
    return a === b;
  },
} as const;

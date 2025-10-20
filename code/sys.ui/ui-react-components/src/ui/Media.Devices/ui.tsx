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
  const items = React.useMemo(
    // Memoize filtering to avoid churn on child rows.
    () => devices.items.filter((d) => props.filter?.(d) ?? true),
    [devices.items, props.filter],
  );

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid', rowGap }),
    empty: css({ padding: 10, placeItems: 'center' }),
    none: css({ padding: 10, opacity: 0.6 }),
  };

  const elEmpty = items.length === 0 && (
    <div className={styles.empty.class}>
      <Spinners.Bar theme={theme.name} />
    </div>
  );

  const elItems = items.map((item, i) => {
    return (
      <Row
        key={wrangle.key(item)}
        device={item}
        debug={debug}
        index={i}
        selected={wrangle.selected(props, item)}
        theme={theme.name}
        onSelect={props.onSelect}
      />
    );
  });

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
    return `${d.kind}:${d.deviceId || '(none)'}`; // NB: guard on weird drivers.
  },
  selected(props: P, item: MediaDeviceInfo): boolean {
    const sel = props.selected;
    if (!sel) return false;
    // Defensive: some browsers report empty deviceId early.
    const a = `${sel.kind}:${sel.deviceId || '(none)'}`;
    const b = `${item.kind}:${item.deviceId || '(none)'}`;
    return a === b;
  },
} as const;

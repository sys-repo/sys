import React from 'react';
import { type t, Color, css, D, Is, Spinners } from './common.ts';
import { Row } from './ui.Row.tsx';
import { useDevicesList } from './use.DevicesList.ts';

type P = t.MediaDevicesProps;

export const List: React.FC<P> = (props) => {
  const { debug = false, rowGap = D.rowGap } = props;

  const devices = useDevicesList();
  let items = devices.items.filter((info) => props.filter?.(info) ?? true);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid', rowGap }),
    empty: css({ padding: 10, placeItems: 'center' }),
  };

  const elEmpty = items.length === 0 && (
    <div className={styles.empty.class}>
      <Spinners.Bar theme={theme.name} />
    </div>
  );

  const elItems = items.map((item, i) => {
    const key = `${item.deviceId}.${i}`;
    return (
      <Row
        key={key}
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
  key(info: MediaDeviceInfo) {
    return `${info.kind}:${info.deviceId}`;
  },
  selected(props: P, item: MediaDeviceInfo): boolean {
    const sel = props.selected;
    if (!sel) return false;
    return wrangle.key(sel) === wrangle.key(item);
  },
} as const;

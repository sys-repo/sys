import React from 'react';
import { type t, Color, css, D, Is, R, Spinners } from './common.ts';
import { Row } from './ui.Row.tsx';
import { useDevicesList } from './use.DevicesList.ts';

type P = t.DevicesProps;

export const List: React.FC<P> = (props) => {
  const { debug = false, rowGap = D.rowGap } = props;

  const devices = useDevicesList();
  let items = devices.items.filter((info) => props.filter?.(info) ?? true);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      rowGap,
    }),
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
        info={item}
        index={i}
        selected={wrangle.selected(props, item, i)}
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
  selected(props: P, item: MediaDeviceInfo, index: number): boolean {
    const { selected } = props;
    if (selected == null) return false;
    if (Is.number(selected) && index === selected) return true;
    if (Is.record(selected)) {
      if (selected.deviceId === item.deviceId && selected.label === item.label) return true;
    }
    return false;
  },
} as const;

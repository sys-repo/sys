import React from 'react';
import { type t, Color, css, D, Is, R } from './common.ts';
import { Row } from './ui.Row.tsx';
import { useDevicesList } from './use.DevicesList.ts';

type P = t.DevicesProps;

export const List: React.FC<P> = (props) => {
  const { debug = false, rowGap = D.rowGap } = props;
  const devices = useDevicesList();

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
    row: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {devices.items.map((item, i) => {
        const key = `${item.deviceId}.${i}`;
        return (
          <Row
            key={key}
            info={item}
            index={i}
            selected={wrangle.selected(props, item, i)}
            theme={theme.name}
            style={styles.row}
            onSelect={props.onSelect}
          />
        );
      })}
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
    if (Is.record(selected) && R.equals(selected, item)) return true;
    return false;
  },
} as const;

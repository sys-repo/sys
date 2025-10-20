import React from 'react';
import { type t, Bullet, Button, Color, css } from './common.ts';
import { Icons } from './ui.Icons.ts';

export type RowProps = {
  debug?: boolean;
  index: t.Index;
  device: MediaDeviceInfo;
  selected?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSelect?: t.DeviceHandler;
};

/**
 * Component:
 */
export const Row: React.FC<RowProps> = (props) => {
  const { debug = false, index, device, selected } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const color = selected ? Color.BLUE : theme.fg;
  const styles = {
    base: css({
      color: theme.fg,
      userSelect: 'none',
      display: 'grid',
    }),
    body: css({
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      alignItems: 'center',
      columnGap: 10,
    }),
    label: css({
      fontSize: 14,
      color: selected ? color : undefined,
      minWidth: 0, // allow shrinking inside CSS grid.
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),
    debug: css({
      fontSize: 9,
      fontFamily: 'monospace',
      marginLeft: 19,
      marginTop: 2,
      opacity: 0.4,
    }),
  };

  const Icon = wrangle.icon(device);
  const elBody = (
    <div className={styles.body.class}>
      <Bullet theme={theme.name} selected={selected} />
      <div className={styles.label.class}>{device.label}</div>
      <Icon color={color} size={18} />
    </div>
  );

  const id = device.deviceId;

  const elDebug = debug && (
    <div className={styles.debug.class}>{`deviceId: ${id.slice(0, 5)}..${id.slice(-5)}`}</div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Button theme={theme.name} onClick={() => props.onSelect?.({ device: device, index })}>
        {elBody}
      </Button>
      {elDebug}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  icon(device: MediaDeviceInfo) {
    const { kind } = device;
    if (kind === 'videoinput') return Icons.Video;
    if (kind === 'audioinput') return Icons.Mic;
    if (kind === 'audiooutput') return Icons.Speaker;
    throw new Error(`Icon for kind "${kind}" not found`);
  },
} as const;

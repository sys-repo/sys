import React from 'react';
import { type t, Bullet, Button, Color, css } from './common.ts';
import { Icons } from './ui.Icons.ts';

export type RowProps = {
  index: t.Index;
  info: MediaDeviceInfo;
  selected?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSelect?: t.DeviceHandler;
};

/**
 * Component:
 */
export const Row: React.FC<RowProps> = (props) => {
  const { index, info, selected } = props;

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
    }),
  };

  const Icon = wrangle.icon(info);
  const elBody = (
    <div className={styles.body.class}>
      <Bullet theme={theme.name} selected={selected} />
      <div className={styles.label.class}>{info.label}</div>
      <Icon color={color} size={18} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Button theme={theme.name} onClick={() => props.onSelect?.({ info, index })}>
        {elBody}
      </Button>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  icon(info: MediaDeviceInfo) {
    const { kind } = info;
    if (kind === 'videoinput') return Icons.Video;
    if (kind === 'audioinput') return Icons.Mic;
    if (kind === 'audiooutput') return Icons.Speaker;
    throw new Error(`Icon for kind "${kind}" not found`);
  },
} as const;

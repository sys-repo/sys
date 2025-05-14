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
  const styles = {
    base: css({
      color: theme.fg,
      userSelect: 'none',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      alignItems: 'center',
      columnGap: 10,
    }),
    label: css({ fontSize: 14 }),
  };

  const Icon = wrangle.icon(info);

  const elLabel = (
    <Button theme={theme.name} onClick={() => props.onSelect?.({ info, index })}>
      <div className={styles.label.class}>{info.label}</div>
    </Button>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Bullet theme={theme.name} selected={selected} />
      {elLabel}
      <Icon color={selected ? Color.BLUE : theme.fg} size={18} />
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

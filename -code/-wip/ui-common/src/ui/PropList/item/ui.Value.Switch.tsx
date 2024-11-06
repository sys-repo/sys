import { Switch } from '../../Button.Switch/mod.ts';
import { Color, css, type t } from './common.ts';

export type SwitchValueProps = {
  value: t.PropListValue;
  isMouseOverItem?: boolean;
  isMouseOverValue?: boolean;
  isItemClickable?: boolean;
  isValueClickable?: boolean;
  enabled?: boolean;
  theme?: t.CommonTheme;
  onClick?: React.MouseEventHandler;
};

export const SwitchValue: React.FC<SwitchValueProps> = (props) => {
  const item = props.value as t.PropListValueSwitch;
  if (item.kind !== 'Switch') return null;

  const value = item.body;
  const itemEnabled = typeof item.enabled === 'boolean' ? item.enabled : value !== undefined;
  const enabled = props.enabled ?? true ? itemEnabled : false;

  const isDark = props.theme === 'Dark';
  const theme = isDark ? Switch.Theme.dark.blue : Switch.Theme.light.blue;
  const styles = { base: css({}) };

  return (
    <Switch
      height={12}
      value={value}
      enabled={enabled}
      track={wrangle.track(item)}
      style={styles.base}
      theme={theme}
      onMouseDown={props.onClick}
    />
  );
};

/**
 * Helpers
 */
const wrangle = {
  track(item: t.PropListValueSwitch): Partial<t.SwitchTrack> | undefined {
    if (!item.color) return undefined;
    const color = {
      ...Switch.Theme.light.blue.trackColor,
      on: Color.format(item.color)!,
    };
    return { color };
  },
} as const;

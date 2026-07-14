import { D, Is, Switch, type t } from './common.ts';
import type { SwitchRowInteraction } from './u/u.interaction.ts';

type P = {
  item: t.KeyValueSwitches.Row;
  interaction: SwitchRowInteraction;
  labelId?: string;
  theme?: t.CommonTheme;
  switch?: t.KeyValueSwitches.Item.SwitchOptions;
};

/** Value-side switch renderer for one KeyValue.Switches row. */
export const SwitchValue: t.FC<P> = (props) => {
  const { item, interaction, labelId } = props;
  const options = { ...D.switch, ...props.switch, ...item.switch };
  const ariaLabel = labelId ? undefined : toAriaLabel(item.label, item.id);

  return (
    <Switch
      {...options}
      value={interaction.value}
      enabled={interaction.enabled}
      theme={props.theme}
      tooltip={item.tooltip}
      aria-label={ariaLabel}
      aria-labelledby={labelId}
      onToggle={(e) => interaction.toggle(e.synthetic, e.next)}
    />
  );
};

/**
 * Helpers:
 */
function toAriaLabel(label: t.ReactNode, fallback: string): string {
  return Is.str(label) && label.trim() ? label.trim() : fallback;
}

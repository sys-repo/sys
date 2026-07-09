import { D, Switch, type t } from './common.ts';
import type { SwitchRowInteraction } from './u.interaction.ts';

type P = {
  item: t.KeyValueSwitches.Row;
  interaction: SwitchRowInteraction;
  theme?: t.CommonTheme;
  switch?: t.KeyValueSwitches.Item.SwitchOptions;
};

/** Value-side switch renderer for one KeyValue.Switches row. */
export const SwitchValue: t.FC<P> = (props) => {
  const { item, interaction } = props;
  const options = { ...D.switch, ...props.switch, ...item.switch };

  return (
    <Switch
      {...options}
      value={interaction.value}
      enabled={interaction.enabled}
      theme={props.theme}
      tooltip={item.tooltip}
      onToggle={(e) => interaction.toggle(e.synthetic, e.next)}
    />
  );
};

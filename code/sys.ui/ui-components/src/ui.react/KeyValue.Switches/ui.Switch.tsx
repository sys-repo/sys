import { D, Switch, type t } from './common.ts';

type P = {
  item: t.KeyValueSwitches.Item;
  index: number;
  enabled?: boolean;
  theme?: t.CommonTheme;
  switch?: t.KeyValueSwitches.Item.SwitchOptions;
};

/** Value-side switch renderer for one KeyValue.Switches row. */
export const SwitchValue: t.FC<P> = (props) => {
  const { item, index } = props;
  const value = Boolean(item.value);
  const enabled = (props.enabled ?? true) && (item.enabled ?? true) && Boolean(item.onToggle);
  const options = { ...D.switch, ...props.switch, ...item.switch };

  return (
    <Switch
      {...options}
      value={value}
      enabled={enabled}
      theme={props.theme}
      tooltip={item.tooltip}
      onClick={() => item.onToggle?.(!value, { item, index })}
    />
  );
};

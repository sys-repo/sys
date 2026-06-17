import { Color, D, KeyValueUI, type t } from './common.ts';
import { toItems } from './u.items.tsx';

export const Switches: t.FC<t.KeyValueSwitches.Props> = (props) => {
  const { items, switch: switchOptions, layout, ...keyValueProps } = props;
  const theme = Color.theme(props.theme);

  return (
    <KeyValueUI
      {...keyValueProps}
      theme={theme.name}
      layout={layout ?? D.layout}
      items={toItems(items, {
        enabled: props.enabled,
        theme: theme.name,
        switch: switchOptions,
      })}
    />
  );
};

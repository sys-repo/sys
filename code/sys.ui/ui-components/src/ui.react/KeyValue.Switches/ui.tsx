import { useId } from 'react';

import { Color, KeyValueUI, type t } from './common.ts';
import { toItemsForRender } from './u.items.tsx';
import { toSwitchLayout } from './u.layout.ts';

export const Switches: t.FC<t.KeyValueSwitches.Props> = (props) => {
  const { items, switch: switchOptions, layout, cursor, ...keyValueProps } = props;
  const theme = Color.theme(props.theme);
  const labelIdScope = useId();
  const resolvedLayout = toSwitchLayout(layout);

  return (
    <KeyValueUI
      {...keyValueProps}
      theme={theme.name}
      layout={resolvedLayout}
      cursor={cursor}
      items={toItemsForRender(items, {
        enabled: props.enabled,
        theme: theme.name,
        switch: switchOptions,
        cursor,
        labelIdScope,
      })}
    />
  );
};


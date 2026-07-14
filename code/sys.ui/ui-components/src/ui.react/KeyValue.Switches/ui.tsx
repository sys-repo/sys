import { useId } from 'react';

import { Color, KeyValueUI, type t } from './common.ts';
import { toggleCursorSpace } from './u/u.cursor-action.ts';
import { toItemsForRender } from './u/u.items.tsx';
import { toSwitchLayout } from './u/u.layout.ts';

export const Switches: t.FC<t.KeyValueSwitches.Props> = (props) => {
  const { items, switch: switchOptions, layout, cursor, ...keyValueProps } = props;
  const theme = Color.theme(props.theme);
  const labelIdScope = useId();
  const resolvedLayout = toSwitchLayout(layout);

  return (
    <div
      style={{ display: 'contents' }}
      onKeyDown={(event) => {
        if (toggleCursorSpace({ event, items, enabled: props.enabled, cursor })) {
          event.preventDefault();
        }
      }}
    >
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
    </div>
  );
};

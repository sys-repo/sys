import { css, Is, type t } from './common.ts';
import { SwitchValue } from './ui.Switch.tsx';
import { toInteraction, type SwitchRowInteraction } from './u.interaction.ts';

const isHr = (item: t.KeyValueSwitches.Item): item is t.KeyValue.Hr => {
  return Is.object(item) && 'kind' in item && item.kind === 'hr';
};

const isGroup = (item: t.KeyValueSwitches.Item): item is t.KeyValueSwitches.Group => {
  return Is.object(item) && 'kind' in item && item.kind === 'group';
};

type ToItemsRenderOptions = t.KeyValueSwitches.ToItems.Options & { labelIdScope: string };
type ToItemsInternalOptions = t.KeyValueSwitches.ToItems.Options & {
  labelIdScope?: string;
  path?: readonly number[];
};
type ToItemInternalOptions = t.KeyValueSwitches.ToItem.Options & { labelId?: string };

/** Convert one switch input into a KeyValue row. */
export const toItem: t.KeyValueSwitches.ToItem = (item, options = {}) => {
  return toItemInternal(item, options);
};

function toItemInternal(item: t.KeyValueSwitches.Row, options: ToItemInternalOptions = {}): t.KeyValue.Row {
  const index = options.index ?? 0;
  const interaction = toInteraction(item, index, options.enabled);
  const labelId = options.labelId;

  return {
    id: item.id,
    kind: 'row',
    k: <SwitchLabel item={item} interaction={interaction} labelId={labelId} />,
    v: (
      <SwitchValue
        item={item}
        interaction={interaction}
        labelId={labelId}
        theme={options.theme}
        switch={options.switch}
      />
    ),
    opacity: item.opacity,
    x: item.x,
    y: item.y,
  };
}

type SwitchLabelProps = {
  item: t.KeyValueSwitches.Row;
  interaction: SwitchRowInteraction;
  labelId?: string;
};

const SwitchLabel: t.FC<SwitchLabelProps> = (props) => {
  const { item, interaction, labelId } = props;
  const label = item.label ?? item.id;
  const styles = {
    base: css({
      cursor: interaction.enabled ? 'pointer' : undefined,
      userSelect: 'none',
    }),
  };

  return (
    <span
      id={labelId}
      className={styles.base.class}
      data-component="KeyValue.Switches.Label"
      aria-disabled={interaction.enabled ? undefined : true}
      onClick={interaction.enabled ? (e) => interaction.toggle(e) : undefined}
    >
      {label}
    </span>
  );
};

/** Convert switch inputs into KeyValue items. */
export const toItems: t.KeyValueSwitches.ToItems = (items = [], options = {}) => {
  return toItemsInternal(items, options);
};

/** Convert switch inputs for the render-owned `Switches.UI` surface. */
export function toItemsForRender(
  items: t.KeyValueSwitches.Item[] | undefined,
  options: ToItemsRenderOptions,
): t.KeyValue.Item[] {
  return toItemsInternal(items, { ...options, path: [] });
}

/**
 * Helpers:
 */
function toItemsInternal(
  items: t.KeyValueSwitches.Item[] = [],
  options: ToItemsInternalOptions = {},
): t.KeyValue.Item[] {
  const path = options.path ?? [];

  return items.map((item, index) => {
    const itemPath = [...path, index];
    if (isHr(item)) return item;
    if (isGroup(item)) {
      return {
        id: item.id,
        kind: 'group',
        items: toItemsInternal(item.items, { ...options, path: itemPath }),
      };
    }

    const labelId = options.labelIdScope
      ? toLabelId(options.labelIdScope, itemPath, item.id)
      : undefined;
    return toItemInternal(item, {
      enabled: options.enabled,
      theme: options.theme,
      switch: options.switch,
      index,
      labelId,
    });
  });
}

function toLabelId(scope: string, path: readonly number[], id: string): string {
  return `${scope}:KeyValue.Switches.Label:${path.join('.')}:${encodeURIComponent(id)}`;
}

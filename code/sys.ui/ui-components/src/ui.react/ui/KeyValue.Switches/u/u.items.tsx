import { css, type t } from '../common.ts';
import { SwitchValue } from '../ui.Switch.tsx';
import { type SwitchRowInteraction, toInteraction } from './u.interaction.ts';
import { SwitchesIs } from './u.is.ts';

type ToItemsRenderOptions = t.KeyValueSwitches.ToItems.Options & {
  cursor?: t.KeyValue.Cursor.Props;
  labelIdScope: string;
};
type ToItemsInternalOptions = t.KeyValueSwitches.ToItems.Options & {
  cursor?: t.KeyValue.Cursor.Props;
  labelIdScope?: string;
  path?: readonly number[];
  targetPath?: t.ObjectPath;
};
type ToItemInternalOptions = t.KeyValueSwitches.ToItem.Options & {
  cursor?: t.KeyValue.Cursor.Props;
  labelId?: string;
  target?: t.KeyValue.Cursor.Target;
};

/** Convert one switch input into a KeyValue row. */
export const toItem: t.KeyValueSwitches.ToItem = (item, options = {}) => {
  return toItemInternal(item, options);
};

function toItemInternal(
  item: t.KeyValueSwitches.Row,
  options: ToItemInternalOptions = {},
): t.KeyValue.Item.Row {
  const index = options.index ?? 0;
  const interaction = toInteraction(item, index, options.enabled, options.cursor, options.target);
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
      data-component='KeyValue.Switches.Label'
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
  const targetPath = options.targetPath ?? [];

  return items.map((item, index) => {
    const itemPath = [...path, index];
    if (SwitchesIs.hr(item)) return item;

    const itemTargetPath = [...targetPath, item.id];
    if (SwitchesIs.group(item)) {
      return {
        id: item.id,
        kind: 'group',
        items: toItemsInternal(item.items, {
          ...options,
          path: itemPath,
          targetPath: itemTargetPath,
        }),
      };
    }

    const labelId = options.labelIdScope
      ? toLabelId(options.labelIdScope, itemPath, item.id)
      : undefined;
    return toItemInternal(item, {
      enabled: options.enabled,
      theme: options.theme,
      switch: options.switch,
      cursor: options.cursor,
      index,
      labelId,
      target: { path: itemTargetPath },
    });
  });
}

function toLabelId(scope: string, path: readonly number[], id: string): string {
  return `${scope}:KeyValue.Switches.Label:${path.join('.')}:${encodeURIComponent(id)}`;
}

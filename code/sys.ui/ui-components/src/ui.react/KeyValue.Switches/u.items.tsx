import { css, Is, type t } from './common.ts';
import { SwitchValue } from './ui.Switch.tsx';
import { toInteraction, type SwitchRowInteraction } from './u.interaction.ts';

const isHr = (item: t.KeyValueSwitches.Item): item is t.KeyValue.Hr => {
  return Is.object(item) && 'kind' in item && item.kind === 'hr';
};

const isGroup = (item: t.KeyValueSwitches.Item): item is t.KeyValueSwitches.Group => {
  return Is.object(item) && 'kind' in item && item.kind === 'group';
};

/** Convert one switch input into a KeyValue row. */
export const toItem: t.KeyValueSwitches.ToItem = (item, options = {}) => {
  const index = options.index ?? 0;
  const interaction = toInteraction(item, index, options.enabled);

  return {
    id: item.id,
    kind: 'row',
    k: <SwitchLabel item={item} interaction={interaction} />,
    v: <SwitchValue item={item} interaction={interaction} theme={options.theme} switch={options.switch} />,
    opacity: item.opacity,
    x: item.x,
    y: item.y,
  };
};

type SwitchLabelProps = {
  item: t.KeyValueSwitches.Row;
  interaction: SwitchRowInteraction;
};

const SwitchLabel: t.FC<SwitchLabelProps> = (props) => {
  const { item, interaction } = props;
  const label = item.label ?? item.id;
  const styles = {
    base: css({
      cursor: interaction.enabled ? 'pointer' : undefined,
      userSelect: 'none',
    }),
  };

  return (
    <span
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
  return items.map((item, index) => {
    if (isHr(item)) return item;
    if (isGroup(item)) return { id: item.id, kind: 'group', items: toItems(item.items, options) };
    return toItem(item, { ...options, index });
  });
};

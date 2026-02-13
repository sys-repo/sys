import { type t, Bullet, Button, Color, css, Keyboard, Num } from './common.ts';

type P = t.BulletList.Props;

export const BulletList: t.FC<P> = (props) => {
  const { debug = false, selected } = props;
  const items = props.items ?? [];
  const columns = wrangle.columns(props.columns);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      lineHeight: 1.6,
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    }),
    row: css({
      display: 'grid',
      gridTemplateColumns: `auto 1fr`,
      alignItems: 'center',
      gap: 8,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {items.map((item) => {
        if (item.kind === 'content') {
          return <div key={item.key}>{item.render()}</div>;
        }

        const id = item.id;
        const enabled = item.enabled ?? true;
        const label = item.label ?? id;
        return (
          <Button
            key={id}
            theme={theme.name}
            enabled={enabled}
            onMouse={(e) => handleSelect(props.onSelect, id, e)}
          >
            <div className={styles.row.class}>
              <Bullet theme={theme.name} selected={isSelected(selected, id)} />
              <div>{label}</div>
            </div>
          </Button>
        );
      })}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  columns(value: number | undefined): number {
    return Num.clamp(1, Num.INFINITY, Math.floor(value ?? 1));
  },
};

function isSelected(selected: t.BulletList.Selected | undefined, id: string): boolean {
  if (Array.isArray(selected)) return selected.includes(id);
  return selected === id;
}

function handleSelect(
  onSelect: t.BulletList.Props['onSelect'],
  id: string,
  e: t.ButtonMouseHandlerArgs,
): void {
  if (e.action !== 'MouseDown') return;
  if (!e.is.enabled) return;
  onSelect?.(toSelectEvent(id, e.modifiers));
}

function toSelectEvent(id: string, modifiers: t.KeyboardModifierFlags): t.BulletList.OnSelectArgs {
  return {
    id,
    modifiers,
    is: {
      command: Keyboard.Is.command(modifiers),
      modified: Keyboard.Is.modified(modifiers),
    },
  };
}

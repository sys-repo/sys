import { type t, Bullet, Button, Color, css, Keyboard } from './common.ts';

type P = t.BulletList.Props;

export const BulletList: t.FC<P> = (props) => {
  const { debug = false, selected } = props;
  const items = props.items ?? [];

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

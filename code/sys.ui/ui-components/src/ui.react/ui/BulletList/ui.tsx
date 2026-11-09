import { type t, Bullet, Button, Color, css, Is, Keyboard, Num } from './common.ts';

/**
 * Render actions or controlled pressed choices in ordinary list and Tab order.
 */
export const BulletList: t.BulletList.Lib['UI'] = (props) => {
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
      margin: 0,
      padding: 0,
      listStyle: 'none',
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    }),
    row: css({
      display: 'grid',
      gridTemplateColumns: `auto 1fr`,
      alignItems: 'start',
      gap: 8,
    }),
    bullet: css({
      height: '1lh',
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <ul role='list' className={css(styles.base, props.style).class}>
      {items.map((item) => {
        if (item.kind === 'content') {
          return <li key={item.key}>{item.render()}</li>;
        }

        const id = item.id;
        const enabled = item.enabled ?? true;
        const label = item.label ?? id;
        return (
          <li key={id}>
            <Button
              block
              theme={theme.name}
              enabled={enabled}
              aria-pressed={selected === undefined ? undefined : isSelected(selected, id)}
              onClick={(e) => props.onActivate?.(toActivateEvent(id, Keyboard.modifiers(e)))}
            >
              <div className={styles.row.class}>
                <div aria-hidden='true' className={styles.bullet.class}>
                  <Bullet theme={theme.name} selected={isSelected(selected, id)} />
                </div>
                <div>{label}</div>
              </div>
            </Button>
          </li>
        );
      })}
    </ul>
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
  if (selected === undefined) return false;
  return Is.string(selected) ? selected === id : selected.includes(id);
}

function toActivateEvent<Id extends string>(
  id: Id,
  modifiers: t.Keyboard.Modifier.Flags,
): t.BulletList.Activate.Args<Id> {
  return {
    id,
    modifiers,
    is: {
      command: Keyboard.Is.command(modifiers),
      modified: Keyboard.Is.modified(modifiers),
    },
  };
}

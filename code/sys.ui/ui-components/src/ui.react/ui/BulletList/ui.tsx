import { Bullet, Button, Color, css, D, Is, Keyboard, Num, type t } from './common.ts';

/**
 * Render actions or controlled pressed choices in ordinary list and Tab order.
 */
export const BulletList: t.BulletList.Lib['UI'] = (props) => {
  const { debug = false, selected, size = D.size } = props;
  const items = props.items ?? [];
  const columns = wrangle.columns(props.columns, items.length);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      fontSize: D.fontSize[size],
      lineHeight: D.lineHeight,
      margin: 0,
      padding: 0,
      listStyle: 'none',
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      alignItems: 'start',
      columnGap: D.columnGap,
      rowGap: D.rowGap,
    }),
    cell: css({ minWidth: 0 }),
    row: css({
      display: 'grid',
      minWidth: 0,
      gridTemplateColumns: 'auto minmax(0, 1fr)',
      alignItems: 'start',
      gap: D.markerGap,
    }),
    label: css({ minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere' }),
    bullet: css({ height: '1lh', display: 'grid', placeItems: 'center' }),
  };

  return (
    <ul role='list' className={css(styles.base, props.style).class}>
      {items.map((item) => {
        if (item.kind === 'content') {
          return <li key={item.key} className={styles.cell.class}>{item.render()}</li>;
        }

        const id = item.id;
        const enabled = item.enabled ?? true;
        const label = item.label ?? id;
        return (
          <li key={id} className={styles.cell.class}>
            <Button
              block
              theme={theme.name}
              enabled={enabled}
              padding={props.itemPadding}
              aria-pressed={selected === undefined ? undefined : isSelected(selected, id)}
              onClick={(e) => props.onActivate?.(toActivateEvent(id, Keyboard.modifiers(e)))}
            >
              <div className={styles.row.class}>
                <div aria-hidden='true' className={styles.bullet.class}>
                  <Bullet
                    theme={theme.name}
                    selected={isSelected(selected, id)}
                    filled={selected === undefined}
                    style={{ width: D.markerSize, height: D.markerSize }}
                  />
                </div>
                <div className={styles.label.class}>{label}</div>
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
  columns(value: number | undefined, count: number): number {
    const requested = Num.Is.finite(value) ? Math.floor(value) : D.columns;
    return Num.clamp(1, Math.max(1, count), requested);
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

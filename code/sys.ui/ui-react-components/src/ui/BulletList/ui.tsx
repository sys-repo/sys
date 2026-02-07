import { type t, Bullet, Button, Color, css } from './common.ts';

export const BulletList: t.FC<t.BulletList.Props> = (props) => {
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
            onMouseDown={() => props.onSelect?.({ id })}
          >
            <div className={styles.row.class}>
              <Bullet theme={theme.name} selected={id === selected} />
              <div>{label}</div>
            </div>
          </Button>
        );
      })}
    </div>
  );
};

import { type t, BulletList, Color, css, D, Signal } from './common.ts';
import { useController } from './use.Controller.ts';

export const Mounts: t.FC<t.Mounts.Props> = (props) => {
  const { debug = false } = props;
  const state = useController(props);
  Signal.useRedrawEffect(() => Signal.listen(state, true));

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(0),
      color: theme.fg,
      padding: 10,
      display: 'grid',
      rowGap: 8,
      lineHeight: 1.6,
    }),
    meta: css({ opacity: 0.6, fontSize: 12 }),
  };
  const items = toRows(state.mounts.value ?? []);

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      {state.loading.value && <div className={styles.meta.class}>Loading mounts...</div>}
      {!state.loading.value && state.error.value && <div className={styles.meta.class}>{state.error.value}</div>}
      {!state.loading.value && !state.error.value && items.length === 0 && (
        <div className={styles.meta.class}>No mounts found.</div>
      )}
      {items.length > 0 && (
        <BulletList.UI
          theme={theme.name}
          selected={state.selected.value}
          items={items}
          onSelect={(e) => {
            const next = e.id as t.StringId;
            state.selected.value = next;
            props.onSelect?.(next);
          }}
        />
      )}
    </div>
  );
};

function toRows(mounts: readonly t.SlcMounts.Entry[]): t.BulletList.Item[] {
  return mounts.map((item) => ({ id: item.mount }));
}

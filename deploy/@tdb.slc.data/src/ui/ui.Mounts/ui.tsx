import { type t, BulletList, Color, css, D, Signal } from './common.ts';
import { Empty } from './ui.Empty.tsx';
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
      color: theme.fg,
      fontSize: 12,
      display: 'grid',
      rowGap: 8,
      lineHeight: 1.6,
    }),
    meta: css({ opacity: 0.6, fontSize: 12 }),
  };
  const items = toRows(state.mounts.value ?? []);
  const error = state.error.value;
  const is = {
    loading: state.loading.value,
    error: Boolean(state.error.value),
    empty: items.length === 0,
    ready: items.length > 0,
  } as const;

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      {is.loading && <div className={styles.meta.class}>Loading mounts...</div>}
      {!is.loading && !is.ready && <Empty theme={theme.name} style={styles.meta} error={error} />}
      {is.ready && (
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

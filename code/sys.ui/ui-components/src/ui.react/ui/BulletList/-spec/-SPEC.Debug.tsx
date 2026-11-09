import React from 'react';
import { Color, css, D, Dev, LocalStorage, Obj, Signal, type t } from './common.ts';

type P = t.BulletList.Props;
type Storage = Pick<P, 'debug' | 'theme' | 'selected' | 'columns'> & { multiple: boolean };
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  selected: 'localhost',
  columns: 1,
  multiple: false,
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Signals:
 */
export async function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    selected: s(snap.selected),
    columns: s(snap.columns),
    multiple: s(snap.multiple ?? defaults.multiple),
  };
  const p = props;
  const api = {
    props,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.selected = p.selected.value;
      d.columns = p.columns.value;
      d.multiple = p.multiple.value;
    });
  });

  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 4,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
};

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
    vcenter: css({ display: 'flex', alignItems: 'center', gap: 6 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Dev.Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Dev.Button
        block
        label={() => `columns: ${v.columns}`}
        onClick={() => Signal.cycle<number>(p.columns, [1, 2, 3])}
      />

      <Dev.Button
        block
        label={() => `multiple: ${v.multiple} (Enter/Space ${v.multiple ? 'toggles' : 'selects'})`}
        onClick={() => Signal.toggle(p.multiple)}
      />

      <hr />
      <Dev.Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Dev.Button block label={() => `(reset)`} onClick={debug.reset} />
      <Dev.ObjectView
        name={'debug'}
        data={Signal.toObject(p)}
        expand={0}
        style={{ marginTop: 20 }}
      />
    </div>
  );
};

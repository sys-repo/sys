import type React from 'react';
import { Color, css, D, Dev, LocalStorage, Obj, Signal, type t } from './common.ts';

type P = t.BulletList.Props;
type Storage = Pick<P, 'debug' | 'theme' | 'selected' | 'columns' | 'size'> & {
  multiple: boolean;
  width: number;
  fontSize: number;
  rtl: boolean;
  sample: 'standard' | 'stress' | 'empty';
};
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  selected: 'localhost',
  columns: D.columns,
  size: D.size,
  multiple: false,
  width: 360,
  fontSize: 16,
  rtl: false,
  sample: 'standard',
};

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
    size: s(snap.size ?? D.size),
    multiple: s(snap.multiple ?? defaults.multiple),
    width: s(snap.width ?? defaults.width),
    fontSize: s(snap.fontSize ?? defaults.fontSize),
    rtl: s(snap.rtl ?? defaults.rtl),
    sample: s(snap.sample ?? defaults.sample),
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
      d.size = p.size.value;
      d.multiple = p.multiple.value;
      d.width = p.width.value;
      d.fontSize = p.fontSize.value;
      d.rtl = p.rtl.value;
      d.sample = p.sample.value;
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
        label={() => `size: ${v.size}`}
        onClick={() => Signal.cycle<t.BulletList.Size>(p.size, ['xs', 'sm', 'md'])}
      />
      <Dev.Button
        block
        label={() => `multiple: ${v.multiple} (enter/space ${v.multiple ? 'toggles' : 'selects'})`}
        onClick={() => Signal.toggle(p.multiple)}
      />

      <hr />
      <div className={Styles.title.class}>Samples</div>
      {(['standard', 'stress', 'empty'] as const).map((sample) => {
        return (
          <Dev.Button
            key={sample}
            block
            label={`sample: ${sample}`}
            onClick={() => p.sample.value = sample}
          />
        );
      })}

      <hr />
      <div className={Styles.title.class}>Debug</div>
      <Dev.Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Dev.Button
        block
        label={() => `host width: ${v.width}px`}
        onClick={() => Signal.cycle(p.width, [180, 360, 640])}
      />
      <Dev.Button
        block
        label={() => `host font: ${v.fontSize}px`}
        onClick={() => Signal.cycle(p.fontSize, [12, 13, 16, 20])}
      />
      <Dev.Button block label={() => `rtl: ${v.rtl}`} onClick={() => Signal.toggle(p.rtl)} />
      <Dev.Button block label={() => `(reset)`} onClick={debug.reset} />
      <Dev.ObjectView
        name='debug'
        data={v}
        expand={0}
        style={{ marginTop: 20 }}
      />
    </div>
  );
};

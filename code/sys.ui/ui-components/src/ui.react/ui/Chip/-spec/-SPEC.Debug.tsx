import type React from 'react';
import { Spec } from '../../-test.ui.ts';
import { Color, css, D, Dev, LocalStorage, Obj, Signal, type t } from './common.ts';

type P = t.Chip.Props;
type Storage = Pick<P, 'debug' | 'theme' | 'mono' | 'size' | 'truncate'> & {
  fontSize: number;
  text: string;
  width: number;
  examples: boolean;
};
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  mono: undefined,
  size: 'sm',
  fontSize: 12,
  text: 'Option + Enter',
  truncate: D.truncate,
  width: 240,
  examples: false,
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
    mono: s(snap.mono),
    size: s(snap.size),
    fontSize: s(snap.fontSize),
    text: s(snap.text),
    truncate: s<P['truncate']>(snap.truncate ?? D.truncate),
    width: s(snap.width ?? defaults.width),
    examples: s(snap.examples ?? defaults.examples),
  };
  const p = props;
  const { attach } = Spec.attachments({
    shared() {
      store.change((d) => {
        d.theme = p.theme.value;
        d.debug = p.debug.value;
        d.mono = p.mono.value;
        d.size = p.size.value;
        d.fontSize = p.fontSize.value;
        d.text = p.text.value;
        d.truncate = p.truncate.value;
        d.width = p.width.value;
        d.examples = p.examples.value;
      });
    },
  });

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
  }

  return { props, listen, reset, attach };
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

  // Match current knobs, not the last preset clicked; custom combinations select neither row.
  const truncate = v.truncate ?? D.truncate;
  const selected = !v.examples && !truncate ? 'single' : v.examples && truncate ? 'overflow' : [];

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
        label={() => `size: ${v.size ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.Chip.Size>(p.size, ['xs', 'sm', 'md'])}
      />
      <Dev.Button
        block
        label={() => `mono: ${v.mono ?? `<undefined> (default: ${D.mono})`}`}
        onClick={() => Signal.cycle(p.mono, [true, false, undefined])}
      />
      <Dev.Button
        block
        label={() => `text: ${v.text}`}
        onClick={() => Signal.cycle(p.text, ['Option + Enter', 'Esc', '🐷 chip'])}
      />

      <hr />
      <Dev.Button
        block
        label={() => `truncate: ${v.truncate ?? `(default: ${D.truncate})`}`}
        onClick={() => Signal.cycle(p.truncate, [true, false, undefined])}
      />
      <Dev.Button
        block
        label={() => `width: ${v.width}px`}
        onClick={() => Signal.cycle(p.width, [120, 180, 240, 360])}
      />
      <Dev.Button
        block
        label={() => `overflow examples: ${v.examples}`}
        onClick={() => Signal.toggle(p.examples)}
      />

      <hr />
      <div className={Styles.title.class}>Sample States</div>
      <Dev.List
        theme={theme.name}
        columns={1}
        selected={selected}
        items={[
          {
            id: 'single',
            label: 'Single chip (unclipped)',
            onActivate: () => {
              p.examples.value = false;
              p.truncate.value = false;
            },
          },
          {
            id: 'overflow',
            label: 'Overflow examples (bounded)',
            onActivate: () => {
              p.examples.value = true;
              p.truncate.value = true;
            },
          },
        ]}
      />

      <hr />
      <div className={Styles.title.class}>Debug</div>
      <Dev.Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Dev.Button
        block
        label={() => `container font-size: ${v.fontSize}px`}
        onClick={() => Signal.cycle(p.fontSize, [10, 12, 14, 16, 20])}
      />
      <Dev.Button block label={() => `(reset)`} onClick={debug.reset} />
      <Dev.ObjectView name='debug' data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};

import type React from 'react';
import { Spec } from '../../-test.ui.ts';
import { Color, css, D, Dev, LocalStorage, Obj, Signal, STORAGE_KEY, type t } from './common.ts';

type P = t.TextLabel.Props;
type Storage = Pick<P, 'debug' | 'value' | 'overflow'> & {
  theme: t.CommonTheme;
  width: number;
  fontSize: number;
};
const defaults: Storage = {
  debug: D.debug,
  theme: 'Dark',
  value: 'Run **build** with `production` settings.',
  overflow: D.overflow,
  width: 240,
  fontSize: 12,
};
const samples = [
  { id: 'mixed', label: 'Supported formatting', value: defaults.value },
  { id: 'plain', label: 'Plain text', value: 'An ordinary label' },
  { id: 'nested', label: 'Nested and adjacent code', value: '**Ag *`Ag`*** `build` `next` Ag' },
  { id: 'literal', label: 'Local literal recovery', value: '**Save** [**help**](/-sample/help)' },
  { id: 'block', label: 'Whole-input fallback', value: '# **Literal heading**' },
  {
    id: 'long',
    label: 'Long code only',
    value: '`/-sample/long-directory-name/example.bundle.js.map`',
  },
] as const;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.Style.Input };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Signals:
 */
export async function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(STORAGE_KEY.DEV, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    value: s(snap.value ?? defaults.value),
    overflow: s(snap.overflow ?? D.overflow),
    width: s(snap.width ?? defaults.width),
    fontSize: s(snap.fontSize ?? defaults.fontSize),
  };
  const p = props;
  const { attach } = Spec.attachments({
    shared() {
      store.change((d) => {
        d.theme = p.theme.value;
        d.debug = p.debug.value;
        d.value = p.value.value;
        d.overflow = p.overflow.value;
        d.width = p.width.value;
        d.fontSize = p.fontSize.value;
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
        label={() => `overflow: ${v.overflow}`}
        onClick={() => Signal.cycle(p.overflow, ['flow', 'truncate', 'host'])}
      />
      <Dev.Button
        block
        label={() => `width: ${v.width}px`}
        onClick={() => Signal.cycle(p.width, [120, 180, 240, 360])}
      />
      <Dev.Button
        block
        label={() => `font-size: ${v.fontSize}px`}
        onClick={() => Signal.cycle(p.fontSize, [10, 12, 14, 16, 20])}
      />

      <hr />
      <div className={Styles.title.class}>Sample States</div>
      <Dev.List
        theme={theme.name}
        columns={1}
        selected={samples.find((item) => item.value === v.value)?.id ?? []}
        items={samples.map(({ id, label, value }) => ({
          id,
          label,
          onActivate: () => {
            p.value.value = value;
          },
        }))}
      />

      <hr />
      <div className={Styles.title.class}>Debug</div>
      <Dev.Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Dev.Button block label={() => `(reset)`} onClick={debug.reset} />
      <Dev.ObjectView name='debug' data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};

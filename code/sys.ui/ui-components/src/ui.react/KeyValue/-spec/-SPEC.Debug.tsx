import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { Color, css, D, LocalStorage, Obj, Signal, type t } from './common.ts';
import { SAMPLE, type SampleKind } from './-samples.tsx';
import { LayoutButtons } from './-ui.Buttons.Layout.tsx';
import { SampleButtons } from './-ui.Buttons.Samples.tsx';

type P = t.KeyValue.Props;
type DebugStorage = Pick<P, 'theme' | 'debug' | 'size' | 'mono' | 'truncate' | 'enabled'> & {
  reorder: boolean;
  animation: boolean;
  cursor: boolean;
  layout: t.KeyValue.Layout['kind'];
  layoutSpaced: t.KeyValue.Layout.Spaced;
  layoutTable: t.KeyValue.Layout.Table;
  sample?: SampleKind;
};

const STORAGE_KEY = `dev:${D.displayName}`;
const DEFAULTS: DebugStorage = {
  theme: 'Dark',
  debug: false,
  size: D.size,
  mono: D.mono,
  truncate: D.truncate,
  enabled: true,
  reorder: false,
  animation: true,
  cursor: false,
  layout: D.layout.default,
  layoutSpaced: D.layout.spaced,
  layoutTable: D.layout.table,
  sample: 'comprehensive',
};

/**
 * Debug component props.
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };

/**
 * Debug signal bundle.
 */
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Create the debug harness signals.
 */
export function createDebugSignals() {
  const s = Signal.create;

  const store = LocalStorage.immutable<DebugStorage>(STORAGE_KEY, DEFAULTS);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    size: s(snap.size),
    mono: s(snap.mono),
    truncate: s(snap.truncate),
    enabled: s(snap.enabled ?? true),
    reorder: s(snap.reorder ?? false),
    animation: s(snap.animation ?? false),
    cursor: s(snap.cursor ?? false),
    cursorModel: s<t.KeyValue.Cursor.Model>({}),
    layout: s(snap.layout),
    layoutSpaced: {
      kind: 'spaced',
      columnGap: s((snap.layoutSpaced ?? {}).columnGap),
      rowGap: s((snap.layoutSpaced ?? {}).rowGap),
      align: s((snap.layoutSpaced ?? {}).align),
    },
    layoutTable: {
      kind: 'table',
      keyMax: s((snap.layoutTable ?? {}).keyMax),
      columnGap: s((snap.layoutTable ?? {}).columnGap),
      rowGap: s((snap.layoutTable ?? {}).rowGap),
      align: s((snap.layoutTable ?? {}).align),
      keyAlign: s((snap.layoutTable ?? {}).keyAlign),
    },
    items: s<t.KeyValue.Item[]>(),
    sample: s(snap.sample),
  };
  const p = props;
  const api = {
    props,
    reset,
    listen,
    get layout(): t.KeyValue.Layout | undefined {
      const v = p.layout.value;
      if (v === 'spaced') return Signal.toObject(p.layoutSpaced) as t.KeyValue.Layout.Spaced;
      if (v === 'table') return Signal.toObject(p.layoutTable) as t.KeyValue.Layout.Table;
      return;
    },
  };
  function listen() {
    Signal.listen(props, true);
  }
  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(DEFAULTS, e.path)));
    p.cursorModel.value = {};
    p.items.value = SAMPLE.items(DEFAULTS.sample);
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.size = p.size.value;
      d.mono = p.mono.value;
      d.truncate = p.truncate.value;
      d.enabled = p.enabled.value;
      d.reorder = p.reorder.value;
      d.animation = p.animation.value;
      d.cursor = p.cursor.value;
      d.sample = p.sample.value;

      d.layout = p.layout.value;

      d.layoutSpaced = d.layoutSpaced ?? {};
      d.layoutSpaced.columnGap = p.layoutSpaced.columnGap.value;
      d.layoutSpaced.rowGap = p.layoutSpaced.rowGap.value;
      d.layoutSpaced.align = p.layoutSpaced.align.value;

      d.layoutTable = d.layoutTable ?? {};
      d.layoutTable.keyMax = p.layoutTable.keyMax.value;
      d.layoutTable.columnGap = p.layoutTable.columnGap.value;
      d.layoutTable.rowGap = p.layoutTable.rowGap.value;
      d.layoutTable.align = p.layoutTable.align.value;
      d.layoutTable.keyAlign = p.layoutTable.keyAlign.value;
    });
  });

  p.items.value = SAMPLE.items(p.sample.value);
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
  note: css({
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 5,
  }),
};

/**
 * Debug controls for the KeyValue spec.
 */
function shuffleItems(items?: t.KeyValue.Item[]) {
  const next = [...(items ?? [])];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function moveRandomItem(items?: t.KeyValue.Item[]) {
  const next = [...(items ?? [])];
  if (next.length < 2) return next;

  const from = Math.floor(Math.random() * next.length);
  const offset = Math.floor(Math.random() * (next.length - 1)) + 1;
  const to = (from + offset) % next.length;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  Signal.useRedrawEffect(debug.listen);

  // Render.
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `enabled: ${p.enabled.value}`}
        onClick={() => Signal.toggle(p.enabled)}
      />
      <Button
        block
        label={() => `size: ${p.size.value}`}
        onClick={() => Signal.cycle<P['size']>(p.size, ['xs', 'sm', 'md'])}
      />
      <Button block label={() => `mono: ${p.mono.value}`} onClick={() => Signal.toggle(p.mono)} />
      <Button
        block
        label={() => `truncate: ${p.truncate.value}`}
        onClick={() => Signal.toggle(p.truncate)}
      />
      <Button
        block
        label={() => `reorder: ${p.reorder.value}`}
        onClick={() => Signal.toggle(p.reorder)}
      />
      <Button
        block
        label={() => `cursor.enabled: ${p.cursor.value}`}
        onClick={() => {
          const next = !p.cursor.value;
          p.cursor.value = next;
          if (!next) p.cursorModel.value = {};
        }}
      />
      {p.cursor.value && (
        <div className={Styles.note.class}>
          {'Option-click a row, or focus the table and press Option+Enter. Use Option+←/→ for key/value lanes; ↑/↓ moves; Enter enters groups; Esc exits.'}
        </div>
      )}
      <hr />
      <LayoutButtons debug={debug} theme={theme.name} />
      <hr style={{ marginTop: 15 }} />
      <div className={Styles.title.class}>{'items:'}</div>
      <SampleButtons debug={debug} theme={theme.name} />
      <div className={Styles.title.class} style={{ marginTop: 12 }}>{'projection motion:'}</div>
      <Button
        block
        label={() => `animation: ${p.animation.value}`}
        onClick={() => Signal.toggle(p.animation)}
      />
      {p.reorder.value && (
        <div className={Styles.note.class}>
          {'Turn reorder off to test this prop; Reorder has its own Motion animation.'}
        </div>
      )}
      <Button
        block
        enabled={!p.reorder.value}
        label={() => `shuffle direct children`}
        onClick={() => (p.items.value = shuffleItems(p.items.value))}
      />
      <Button
        block
        enabled={!p.reorder.value}
        label={() => `move one direct child`}
        onClick={() => (p.items.value = moveRandomItem(p.items.value))}
      />
      <Button
        block
        enabled={!p.reorder.value}
        label={() => `restore sample order`}
        onClick={() => (p.items.value = SAMPLE.items(p.sample.value))}
      />
      <hr style={{ marginTop: 25 }} />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};

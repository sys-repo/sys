import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { Color, css, D, LocalStorage, Obj, Signal, type t } from '../common.ts';
import { SAMPLE, type SampleKind } from './-u.sample.tsx';
import { LayoutButtons } from './-ui.LayoutButtons.tsx';

type P = t.KeyValueProps;
type Storage = Pick<P, 'theme' | 'debug' | 'size' | 'mono' | 'truncate'> & {
  layout: t.KeyValueLayout['kind'];
  layoutSpaced: t.KeyValueLayoutSpaced;
  layoutTable: t.KeyValueLayoutTable;
  sample?: SampleKind;
};
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  size: D.size,
  mono: D.mono,
  truncate: D.truncate,
  layout: D.layout.default,
  layoutSpaced: D.layout.spaced,
  layoutTable: D.layout.table,
  sample: 'comprehensive',
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;

  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    size: s(snap.size),
    mono: s(snap.mono),
    truncate: s(snap.truncate),
    layout: s(snap.layout),
    layoutSpaced: {
      kind: 'spaced',
      columnGap: s((snap.layoutSpaced ?? {}).columnGap),
      rowGap: s((snap.layoutSpaced ?? {}).rowGap),
      align: s((snap.layoutSpaced ?? {}).align),
      keyAlign: s((snap.layoutSpaced ?? {}).keyAlign),
    },
    layoutTable: {
      kind: 'table',
      keyMax: s((snap.layoutTable ?? {}).keyMax),
      columnGap: s((snap.layoutTable ?? {}).columnGap),
      rowGap: s((snap.layoutTable ?? {}).rowGap),
      align: s((snap.layoutTable ?? {}).align),
      keyAlign: s((snap.layoutTable ?? {}).keyAlign),
    },
    items: s<t.KeyValueItem[]>(),
    sample: s(snap.sample),
  };
  const p = props;
  const api = {
    props,
    reset,
    listen,
    get layout(): t.KeyValueLayout | undefined {
      const v = p.layout.value;
      if (v === 'spaced') return Signal.toObject(p.layoutSpaced) as t.KeyValueLayoutSpaced;
      if (v === 'table') return Signal.toObject(p.layoutTable) as t.KeyValueLayoutTable;
      return;
    },
  };
  function listen() {
    Signal.listen(props, true);
  }
  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
    p.items.value = SAMPLE.items('comprehensive');
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.size = p.size.value;
      d.mono = p.mono.value;
      d.truncate = p.truncate.value;
      d.sample = p.sample.value;

      d.layout = p.layout.value;

      d.layoutSpaced = d.layoutSpaced ?? {};
      d.layoutSpaced.columnGap = p.layoutSpaced.columnGap.value;
      d.layoutSpaced.rowGap = p.layoutSpaced.rowGap.value;
      d.layoutSpaced.align = p.layoutSpaced.align.value;
      d.layoutSpaced.keyAlign = p.layoutSpaced.keyAlign.value;

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
    marginBottom: 10,
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
  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
  };

  const itemsButton = (kind?: SampleKind, label?: string) => {
    if (!label) label = `sample: ${kind}`;
    return (
      <Button
        block
        label={label}
        onClick={() => {
          p.items.value = SAMPLE.items(kind);
          p.sample.value = kind;
        }}
      />
    );
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
        label={() => `size: ${p.size.value}`}
        onClick={() => Signal.cycle<P['size']>(p.size, ['xs', 'sm', 'md'])}
      />
      <Button block label={() => `mono: ${p.mono.value}`} onClick={() => Signal.toggle(p.mono)} />
      <Button
        block
        label={() => `truncate: ${p.truncate.value}`}
        onClick={() => Signal.toggle(p.truncate)}
      />

      <hr />

      <LayoutButtons debug={debug} theme={theme.name} />

      <hr style={{ marginTop: 15 }} />
      <div className={Styles.title.class}>{'Items:'}</div>
      {itemsButton(undefined, '(none)')}
      {itemsButton('comprehensive')}
      {itemsButton('simple')}

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

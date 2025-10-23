import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { Color, css, D, LocalStorage, Obj, Signal, type t } from '../common.ts';
import { SAMPLE, type SampleKind } from './-u.sample.tsx';

type P = t.KeyValueProps;
type L = t.KeyValueLayout;
type Storage = Pick<P, 'theme' | 'debug' | 'size' | 'mono' | 'truncate'> & {
  layout: t.KeyValueLayout;
  sample: SampleKind;
};
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  size: D.size,
  mono: D.mono,
  truncate: D.truncate,
  layout: D.layout,
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
    layout: {
      variant: s((snap.layout ?? {}).variant),
      keyMax: s((snap.layout ?? {}).keyMax),
      keyAlign: s((snap.layout ?? {}).keyAlign),
      columnGap: s((snap.layout ?? {}).columnGap),
      rowGap: s((snap.layout ?? {}).rowGap),
      align: s((snap.layout ?? {}).align),
    },
    //
    items: s<t.KeyValueItem[]>(),
    sample: s(snap.sample),
  };
  const p = props;
  const api = {
    props,
    reset,
    listen,
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

      d.layout = d.layout ?? {};
      d.layout.variant = p.layout.variant.value;
      d.layout.keyMax = p.layout.keyMax.value;
      d.layout.keyAlign = p.layout.keyAlign.value;
      d.layout.columnGap = p.layout.columnGap.value;
      d.layout.rowGap = p.layout.rowGap.value;
      d.layout.align = p.layout.align.value;
    });
  });

  p.items.value = SAMPLE.items('comprehensive');
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
        //
        block
        label={label}
        onClick={() => (p.items.value = SAMPLE.items(kind))}
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
      <Button
        block
        label={() => `layout.variant: ${p.layout.variant.value ?? '(undefined)'}`}
        onClick={() => {
          Signal.cycle<L['variant']>(p.layout.variant, [D.layout.variant, 'table', undefined]);
        }}
      />
      <Button
        block
        label={() => `layout.keyMax: ${p.layout.keyMax.value}`}
        onClick={() => {
          Signal.cycle<L['keyMax']>(p.layout.keyMax, [D.layout.keyMax, 60, '5ch']);
        }}
      />
      <Button
        block
        label={() => `layout.keyAlign: ${p.layout.keyAlign.value}`}
        onClick={() => {
          Signal.cycle<L['keyAlign']>(p.layout.keyAlign, [D.layout.keyAlign, 'right']);
        }}
      />
      <Button
        block
        label={() => `layout.columnGap: ${p.layout.columnGap.value}`}
        onClick={() => {
          Signal.cycle<L['columnGap']>(p.layout.columnGap, [4, 8, D.layout.columnGap, 16, 20, 24]);
        }}
      />
      <Button
        block
        label={() => `layout.rowGap: ${p.layout.rowGap.value}`}
        onClick={() => {
          Signal.cycle<L['rowGap']>(p.layout.rowGap, [0, D.layout.rowGap, 6, 10]);
        }}
      />
      <Button
        block
        label={() => `layout.align: ${p.layout.align.value}`}
        onClick={() => {
          Signal.cycle<L['align']>(p.layout.align, [D.layout.align, 'start', 'center']);
        }}
      />

      <hr />
      <div className={Styles.title.class}>{'Items:'}</div>
      {itemsButton(undefined, '(none)')}
      {itemsButton('comprehensive')}
      {itemsButton('simple')}

      <hr />
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

import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, Color, css, D, LocalStorage, Obj, Signal } from '../common.ts';
import { SAMPLE } from './-u.sample.tsx';

type P = t.KeyValueProps;
type L = t.KeyValueLayout;
type Storage = Pick<P, 'theme' | 'debug' | 'size' | 'mono' | 'truncate'> & {
  layout: t.KeyValueLayout;
};
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  size: D.size,
  mono: D.mono,
  truncate: D.truncate,
  layout: D.layout,
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
      columnTemplate: s((snap.layout ?? {}).columnTemplate),
      columnGap: s((snap.layout ?? {}).columnGap),
      rowGap: s((snap.layout ?? {}).rowGap),
    },
    //
    items: s<t.KeyValueItem[]>(),
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
    p.items.value = SAMPLE.items('default');
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.size = p.size.value;
      d.mono = p.mono.value;
      d.truncate = p.truncate.value;

      d.layout = d.layout ?? {};
      d.layout.columnTemplate = p.layout.columnTemplate.value;
      d.layout.columnGap = p.layout.columnGap.value;
      d.layout.rowGap = p.layout.rowGap.value;
    });
  });

  p.items.value = SAMPLE.items('default');
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

  type S = Parameters<(typeof SAMPLE)['items']>[0];
  const itemsButton = (label: string, sample: S) => {
    return (
      <Button
        //
        block
        label={label}
        onClick={() => (p.items.value = SAMPLE.items(sample))}
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
        label={() => `layout.columnTemplate: ${p.layout.columnTemplate.value}`}
        onClick={() => {
          Signal.cycle<L['columnTemplate']>(p.layout.columnTemplate, [
            D.layout.columnTemplate,
            'minmax(80px,auto) 1fr',
            '1fr 2fr',
            'max-content 1fr',
          ]);
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

      <hr />
      <div className={Styles.title.class}>{'Items:'}</div>
      {itemsButton('(none)', undefined)}
      {itemsButton('default sample', 'default')}

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

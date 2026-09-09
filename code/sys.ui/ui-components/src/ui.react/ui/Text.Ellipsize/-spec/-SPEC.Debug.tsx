import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, Color, css, D, LocalStorage, Obj, Signal } from './common.ts';

type P = t.TextEllipsize.Props;
type Storage = Pick<P, 'debug' | 'text' | 'ellipsis' | 'tail'> & { width: number };
const samples = {
  short: 'foobar',
  overflow: 'https://app.example.com/products/foobar/overflow-case/root',
} as const;

const defaults: Storage = {
  debug: false,
  text: samples.overflow,
  tail: 7,
  ellipsis: '…',
  width: 220,
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
    text: s(snap.text),
    tail: s(snap.tail),
    ellipsis: s(snap.ellipsis),
    width: s(snap.width),
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
      d.debug = p.debug.value;
      d.text = p.text.value;
      d.tail = p.tail.value;
      d.ellipsis = p.ellipsis.value;
      d.width = p.width.value;
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

      <Button
        block
        label={() => {
          return `text: ${v.text === samples.short ? 'foobar' : 'overflow'}`;
        }}
        onClick={() => {
          return Signal.cycle(p.text, [samples.short, samples.overflow]);
        }}
      />

      <Button
        block
        label={() => `tail: ${v.tail}`}
        onClick={() => Signal.cycle(p.tail, [5, 7, 9, 12, undefined])}
      />

      <hr />

      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />

      <Button
        block
        label={() => `width: ${v.width}px`}
        onClick={() => Signal.cycle(p.width, [160, 220, 280, 360])}
      />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};

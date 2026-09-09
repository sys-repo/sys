import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { Color, css, D, LocalStorage, Obj, Signal, type t } from './common.ts';

type P = t.Chip.Props;
type Storage = Pick<P, 'debug' | 'theme' | 'mono' | 'size'> & {
  fontSize: number;
  text: string;
};
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  mono: undefined,
  size: 'sm',
  fontSize: 12,
  text: 'Option + Enter',
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
      d.mono = p.mono.value;
      d.size = p.size.value;
      d.fontSize = p.fontSize.value;
      d.text = p.text.value;
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
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `size: ${v.size ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.Chip.Size>(p.size, ['xs', 'sm', 'md'])}
      />
      <Button
        block
        label={() => `mono: ${v.mono ?? `<undefined> (default: ${D.mono})`}`}
        onClick={() => Signal.cycle(p.mono, [true, false, undefined])}
      />
      <Button
        block
        label={() => `text: ${v.text}`}
        onClick={() => Signal.cycle(p.text, ['Option + Enter', 'Esc', '🐷 chip'])}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button
        block
        label={() => `container font-size: ${v.fontSize}px`}
        onClick={() => Signal.cycle(p.fontSize, [10, 12, 14, 16, 20])}
      />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};

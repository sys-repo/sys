import React from 'react';
import { ObjectView } from '../../u.ts';
import { type t, Button, css, D, LocalStorage, Obj, Signal } from '../common.ts';

type P = t.DevicesProps;
type Storage = Pick<P, 'theme' | 'debug' | 'rowGap'> & { filter?: boolean; debugNarrow?: boolean };
const defaults: Storage = {
  debug: false,
  debugNarrow: false,
  theme: 'Dark',
  filter: false,
  rowGap: D.rowGap,
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
    debugNarrow: s(snap.debugNarrow),
    theme: s(snap.theme),
    filter: s(snap.filter),
    rowGap: s(snap.rowGap),
    selected: s<P['selected']>(),
  };
  const p = props;
  const api = {
    props,
    reset,
    listen,
  };

  function listen() {
    Signal.listen(props);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.debugNarrow = p.debugNarrow.value;
      d.filter = p.filter.value;
      d.rowGap = p.rowGap.value;
    });
  });

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
  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
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
        label={() => {
          const v = p.filter.value;
          return `filter: ${v} ${v ? "← io.kind === 'videoinput'" : ''}`;
        }}
        onClick={() => Signal.toggle(p.filter)}
      />
      <Button
        block
        label={() => `rowGap: ${p.rowGap.value ?? `<undefined> (default: ${D.rowGap})`}`}
        onClick={() => Signal.cycle(p.rowGap, [undefined, 15, 30, undefined])}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `debug / narrow: ${p.debugNarrow.value}`}
        onClick={() => Signal.toggle(p.debugNarrow)}
      />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};

import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, LocalStorage, Obj, Signal, Str } from '../common.ts';

type P = t.PathViewProps;
type Storage = Pick<P, 'theme' | 'debug' | 'path' | 'prefix'> & { debugClickHandler?: boolean };
const defaults: Storage = {
  theme: 'Dark',
  debug: true,
  prefix: 'path:',
  path: ['foo', 'bar'],
  debugClickHandler: true,
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
    path: s(snap.path),
    prefix: s(snap.prefix),
    debugClickHandler: s(snap.debugClickHandler),
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
      d.prefix = p.prefix.value;
      d.path = p.path.value;
      d.debugClickHandler = p.debugClickHandler.value;
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
          const v = p.path.value;
          if (v == null) return `path: <undefined>`;
          const items = v.map((segment) => `'${Str.truncate(String(segment), 20)}'`).join(', ');
          return `path: [${items}]`;
        }}
        onClick={() => {
          const values = [
            [],
            ['foo', 'bar'],
            ['👋', Str.lorem, 'hello'],
            ['👋', '🐷', '🌳'],
            undefined,
          ];
          Signal.cycle(p.path, values);
        }}
      />
      <Button
        block
        label={() => `prefix: ${p.prefix.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.prefix, ['path:', 'my-prefix:', undefined])}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `debug: onClickHandler: ${p.debugClickHandler.value ? '(ƒ) ← true' : 'false'}`}
        onClick={() => Signal.toggle(p.debugClickHandler)}
      />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};

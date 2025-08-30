import React from 'react';

import { createRepo } from '../../-test.ui.ts';
import { type t, Button, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';

type P = t.BinaryFileProps;
type Storage = Pick<P, 'theme' | 'debug' | 'path'>;
const defaults: Storage = {
  theme: 'Dark',
  debug: true,
  path: ['files'],
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

export const STORAGE_KEY = { DEV: `dev:${D.name}.docid` };

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
    doc: s<t.Crdt.Ref>(),
  };
  const p = props;
  const repo = createRepo();
  const api = {
    props,
    repo,
    reset,
    listen() {
      Object.values(props)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.path = p.path.value;
    });
  });

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

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
        label={() => `path: ${p.path.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.path, [undefined, ['files'], ['foo', 'bar']])}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView
        name={'debug'}
        data={{
          ...Signal.toObject(p),
          doc: p.doc.value?.current,
        }}
        expand={0}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};

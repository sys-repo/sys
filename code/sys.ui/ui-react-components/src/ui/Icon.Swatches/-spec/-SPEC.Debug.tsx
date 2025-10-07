import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { Icons } from '../../ui.Icons.ts';

import { type t, css, D, LocalStorage, Obj, Signal } from '../common.ts';
import { IconSwatches } from '../mod.ts';

type P = t.IconSwatchesProps;
type Storage = Pick<P, 'theme' | 'debug' | 'minSize' | 'maxSize' | 'percent' | 'selected'>;
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  minSize: D.minSize,
  maxSize: D.maxSize,
  percent: 0.25,
  selected: undefined,
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
    minSize: s(snap.minSize),
    maxSize: s(snap.maxSize),
    percent: s(snap.percent),
    selected: s(snap.selected),
    items: s<t.IconSwatchItem[]>(),
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

  function setIcons() {
    // Load sample items by walking the local {Icons} object.
    p.items.value = IconSwatches.Walk.icons(Icons);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
    setIcons();
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.minSize = p.minSize.value;
      d.maxSize = p.maxSize.value;
      d.percent = p.percent.value;
      d.selected = p.selected.value;
    });
  });

  setIcons();
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
        label={() => `minSize: ${p.minSize.value ?? `<undefined> (default: ${D.minSize})`}`}
        onClick={() => Signal.cycle(p.minSize, [D.minSize, 30, 90])}
      />
      <Button
        block
        label={() => `maxSize: ${p.maxSize.value ?? `<undefined> (default: ${D.maxSize})`}`}
        onClick={() => Signal.cycle(p.maxSize, [90, D.maxSize, 480, 1024])}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};

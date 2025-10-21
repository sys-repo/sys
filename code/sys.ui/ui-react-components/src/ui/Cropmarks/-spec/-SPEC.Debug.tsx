import React from 'react';
import { Button, ObjectView } from '../../u.ts';

import { type t, css, D, LocalStorage, Obj, Signal } from '../common.ts';
import { DebugCenter } from './-ui.Debug.Center.tsx';
import { DebugFill } from './-ui.Debug.Fill.tsx';
import { DebugPercent } from './-ui.Debug.Percent.tsx';

type P = t.CropmarksProps;
type Storage = Pick<P, 'theme' | 'debug' | 'size' | 'subjectOnly'>;
const defaults: Storage = {
  theme: 'Dark',
  debug: true,
  subjectOnly: false,
  size: undefined,
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
    subjectOnly: s(snap.subjectOnly),
    size: s(snap.size),
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
      d.size = p.size.value;
      d.subjectOnly = p.subjectOnly.value;
    });
  });

  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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

  const setSize = (label: string, size?: t.CropmarksSize) => {
    const onClick = () => (p.size.value = size);
    return <Button block label={`size: ${label}`} onClick={onClick} />;
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
        label={`subjectOnly: ${p.subjectOnly}`}
        onClick={() => Signal.toggle(p.subjectOnly)}
      />

      <hr />
      {setSize('<undefined>', undefined)}
      {setSize('center', { mode: 'center' })}
      {setSize('fill', { mode: 'fill', x: true, y: true, margin: [40, 40, 40, 40] })}
      {setSize('percent: 80% both', { mode: 'percent', width: 80, height: 80, margin: 40 })}
      {setSize('percent: 70% width', { mode: 'percent', width: 70, margin: [40, 40, 40, 40] })}

      {!!p.size.value?.mode && <hr />}
      {p.size.value?.mode === 'center' && <DebugCenter debug={debug} />}
      {p.size.value?.mode === 'fill' && <DebugFill debug={debug} />}
      {p.size.value?.mode === 'percent' && <DebugPercent debug={debug} />}

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

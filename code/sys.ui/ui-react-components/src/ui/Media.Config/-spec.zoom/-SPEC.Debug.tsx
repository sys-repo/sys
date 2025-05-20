import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, LocalStorage, Obj, Signal } from '../common.ts';
import { Config } from '../mod.ts';

type P = t.MediaZoomProps;
const Zoom = Config.Zoom;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  type L = { values: P['values'] };
  const values = Zoom.values(Obj.keys(Zoom.config));
  const localstore = LocalStorage.immutable<L>(`dev:${D.name}.Zoom`, { values });

  const s = Signal.create;
  const props = {
    debug: s(false),
    theme: s<P['theme']>('Dark'),
    values: s<P['values']>(localstore.current.values),
    debounce: s<P['debounce']>(250),
  };
  const p = props;
  const api = {
    props,
    localstore,
    listen() {
      p.debug.value;
      p.theme.value;
      p.values.value;
      p.debounce.value;
    },
  };
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
      <div className={Styles.title.class}>{'Media.Config.Zoom'}</div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `debounce: ${p.debounce.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.debounce, [0, 250, 800, undefined])}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView
        name={'debug'}
        data={Signal.toObject(p)}
        expand={['$', '$.values']}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};

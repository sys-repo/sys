import React from 'react';
import { ObjectView } from '../../ObjectView/mod.ts';

import { type t, css, D, Is, LocalStorage, Signal } from '../common.ts';
import { Button } from '../mod.ts';

type P = t.ButtonProps;
type Storage = Pick<P, 'theme' | 'debug'> & { enabled?: boolean; opacity?: t.Percent };

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

  const defaults: Storage = {
    theme: 'Dark',
    debug: true,
    enabled: true,
    opacity: 1,
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    enabled: s(snap.enabled),
    opacity: s(snap.opacity),
  };
  const p = props;
  const api = {
    props,
    listen() {
      Signal.listen(props);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;

      // NB: functions not storable.
      d.enabled = Is.func(p.enabled.value) ? true : d.enabled;
      d.opacity = Is.func(p.opacity.value) ? 1 : d.opacity;
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
  const styles = { base: css({}) };

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
          const v = p.enabled.value;
          return `enabled: ${Is.func(v) ? 'ƒ' : v}`;
        }}
        onClick={() => {
          const fn = () => false;
          Signal.cycle(p.enabled, [true, false, fn]);
        }}
      />

      <Button
        block
        label={() => {
          const v = p.opacity.value;
          return `opacity: ${Is.func(v) ? 'ƒ' : v}`;
        }}
        onClick={() => {
          type F = t.ButtonPropCallback<t.Percent>;
          const fn: F = (e) => (e.is.enabled ? (e.is.over ? 0.8 : 0.3) : 0.1);
          Signal.cycle(p.opacity, [1, 0.1, fn]);
        }}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};

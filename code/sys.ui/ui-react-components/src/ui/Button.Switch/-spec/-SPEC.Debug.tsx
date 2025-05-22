import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, Signal } from '../common.ts';
import { Switch } from '../mod.ts';

type P = t.SwitchProps;

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
  const props = {
    debug: s(false),
    baseTheme: s<t.CommonTheme>('Light'),

    enabled: s<P['enabled']>(D.enabled),
    value: s<P['value']>(true),
    theme: s<P['theme']>(),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.baseTheme.value;
      p.theme.value;
      p.value.value;
      p.enabled.value;
    },
    updateTheme(color: 'green' | 'blue') {
      const m = p.baseTheme.value === 'Dark' ? Switch.Theme.dark : Switch.Theme.light;
      let value = m.default;
      if (color === 'green') value = m.green;
      if (color === 'blue') value = m.blue;
      p.theme.value = value;
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
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${p.baseTheme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.baseTheme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `enabled: ${p.enabled.value ?? `<undefined> (default: ${D.enabled})`}`}
        onClick={() => Signal.toggle(p.enabled)}
      />
      <Button
        block
        label={() => `value: ${p.value.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle<P['value']>(p.value, [undefined, true, false])}
      />

      <hr />
      <div className={Styles.title.class}>{'Theme Variations'}</div>
      <Button block label={() => `blue (default)`} onClick={() => debug.updateTheme('blue')} />
      <Button block label={() => `green`} onClick={() => debug.updateTheme('green')} />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView
        name={'debug'}
        data={Signal.toObject(p)}
        expand={['$']}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};

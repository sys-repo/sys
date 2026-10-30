import type React from 'react';
import { Button, ObjectView } from '../../u.ts';

import { css, D, Signal, type t } from '../common.ts';
import { SwitchTheme } from '../mod.ts';

type P = t.Switch.Props;

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
    enabled: s<P['enabled']>(D.enabled),
    value: s<P['value']>(true),
    theme: s<t.CommonTheme>('Light'),
    color: s<'blue' | 'green' | 'yellow' | undefined>(undefined),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.theme.value;
      p.value.value;
      p.enabled.value;
      p.color.value;
    },
    get switchTheme(): P['theme'] {
      const name = p.theme.value;
      const color = p.color.value;
      return color === undefined ? name : SwitchTheme.fromName(name)[color];
    },
    updateTheme(color: 'blue' | 'green' | 'yellow') {
      p.color.value = color;
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
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle(p.theme, ['Light', 'Dark'])}
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
      <Button block label={() => `yellow`} onClick={() => debug.updateTheme('yellow')} />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView
        name='debug'
        data={Signal.toObject(p)}
        expand={['$']}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};

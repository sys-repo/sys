import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, Signal } from '../common.ts';

type P = t.MediaConfigSliderProps;

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
    theme: s<P['theme']>('Light'),
    label: s<P['label']>('my-label'),
    value: s<P['value']>(),
    unit: s<P['unit']>('%'),
    range: s<P['range']>([0, 200]),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.theme.value;
      p.label.value;
      p.unit.value;
      p.range.value;
      p.value.value;
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
      <div className={Styles.title.class}>{'Media.Config.Slider'}</div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `value: ${p.value.value?.toFixed() ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.value, [0, 100, 200, undefined])}
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
        expand={['$']}
        style={{ marginTop: 5 }}
      />
    </div>
  );
};

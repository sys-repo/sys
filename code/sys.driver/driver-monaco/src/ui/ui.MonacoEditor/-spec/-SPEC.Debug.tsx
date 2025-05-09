import React from 'react';
import { type t, Button, css, D, ObjectView, Signal } from '../common.ts';

type P = t.MonacoEditorProps;

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
    render: s(true),
    theme: s<P['theme']>('Dark'),
    enabled: s<P['enabled']>(D.props.enabled),
    readOnly: s<P['readOnly']>(D.props.readOnly),
    minimap: s<P['minimap']>(D.props.minimap),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.render.value;
      p.theme.value;
      p.readOnly.value;
      p.minimap.value;
      p.enabled.value;
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
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `render: ${p.render.value}`}
        onClick={() => Signal.toggle(p.render)}
      />
      <hr />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `enabled: ${p.enabled.value}`}
        onClick={() => Signal.toggle(p.enabled)}
      />
      <Button
        block
        label={() => `readOnly: ${p.readOnly.value}`}
        onClick={() => Signal.toggle(p.readOnly)}
      />
      <Button
        block
        label={() => `minimap: ${p.minimap.value}`}
        onClick={() => Signal.toggle(p.minimap)}
      />

      <hr />
      <ObjectView name={'debug'} data={Signal.toObject(debug)} expand={['$']} />
    </div>
  );
};

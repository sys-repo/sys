import React from 'react';
import { type t, Button, css, D, ObjectView, Signal } from '../common.ts';

type P = t.SampleProps;

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
    theme: s<t.CommonTheme>('Light'),
    doc: s<P['doc']>(),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.theme.value;
      p.doc.value;
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
      <div className={Styles.title.class}>
        <div>{`${D.name}: CRDT`}</div>
        <div>{'IndexedDB'}</div>
      </div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={[]} style={{ marginTop: 10 }} />
    </div>
  );
};

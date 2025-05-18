import React from 'react';
import { type t, css, D, Signal } from '../common.ts';
import { Button, ObjectView } from '../../u.ts';

type P = t.DevicesProps;

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
    filter: s(true),
    theme: s<P['theme']>('Dark'),
    rowGap: s<number>(),
    selected: s<P['selected']>(),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.filter.value;
      p.rowGap.value;
      p.theme.value;
      p.selected.value;
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
      <hr />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => {
          const v = p.filter.value;
          return `filter: ${v} ${v ? "← io.kind === 'videoinput'" : ''}`;
        }}
        onClick={() => Signal.toggle(p.filter)}
      />
      <Button
        block
        label={() => `rowGap: ${p.rowGap.value ?? `<undefined> (default: ${D.rowGap})`}`}
        onClick={() => Signal.cycle(p.rowGap, [undefined, 15, 30, undefined])}
      />

      <hr />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={['$']} />
    </div>
  );
};

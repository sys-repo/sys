import React from 'react';
import { type t, Button, css, ObjectView, Signal } from './common.ts';

type P = t.ConceptPlayerProps;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  const s = Signal.create;

  const children = <div style={{ padding: 10 }}>{'👋 Hello Column'}</div>;

  const props = {
    debug: s<P['debug']>(true),
    theme: s<P['theme']>('Light'),
    column: s<P['column']>({ children }),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.theme.value;
      p.debug.value;
      p.column.value;
    },
  };

  init?.(api);
  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
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
      <div className={Styles.title.class}>{'ConceptPlayer'}</div>

      <Button
        block
        label={`debug: ${p.debug.value ?? '<undefined>'}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <DebugColumn debug={debug} />

      <hr />
      <ObjectView name={'props'} data={Signal.toObject(debug.props)} expand={3} />
    </div>
  );
};

/**
 * Component: <ControlColumn>
 */
export const DebugColumn: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  const btn = (
    label: string,
    fn: (e: { column: t.ConceptPlayerColumn; clear(): void }) => t.IgnoredResult,
  ) => {
    return (
      <Button
        block
        label={label}
        onClick={() => {
          const signal = p.column;
          const column = { ...(signal.value ?? {}) };
          let clear = false;
          fn({ column, clear: () => (clear = true) });
          signal.value = clear ? undefined : column;
        }}
      />
    );
  };

  const align = (align: t.ConceptPlayerColumn['align']) => {
    return btn(`align: ${align}`, (e) => (e.column.align = align));
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{'MainColumn:'}</div>

      {btn('reset: <undefined>', (e) => e.clear())}

      <hr />
      {align('Left')}
      {align('Center')}
      {align('Right')}

      <hr />
      {btn('marginTop: 0', (e) => (e.column.marginTop = 0))}
      {btn('marginTop: 46', (e) => (e.column.marginTop = 46))}
    </div>
  );
};

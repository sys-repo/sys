import React from 'react';
import { type t, css, ObjectView, Signal } from '../-test.ui.ts';

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
  const props = {
    pointerIs: s<t.PointerHookFlags>(),
    dragArgs: s<t.UsePointerDragHandlerArgs>(),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.dragArgs.value;
      p.pointerIs.value;
    },
  };
  init?.(api);
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
  return (
    <div className={css(props.style).class}>
      <div className={Styles.title.class}>
        <div>{'usePointer'}</div>
        <div>{'Hook'}</div>
      </div>
      <hr />

      <ObjectView
        name={'pointer.is'}
        data={Signal.toObject(p.pointerIs)}
        expand={{ level: 1 }}
        style={{ marginBottom: 20 }}
      />

      <ObjectView
        name={'drag'}
        data={Signal.toObject(p.dragArgs)}
        expand={{ level: 1, paths: ['$', '$.client'] }}
        style={{ marginBottom: 10 }}
      />
    </div>
  );
};

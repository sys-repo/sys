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
  const api = { rect: s<t.DomRect>() };
  init?.(api);
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const rect = debug.rect.value;

  Signal.useRedrawEffect(() => debug.rect.value);

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>⚡️ via signal:</div>
      <ObjectView name={'rect'} data={rect} margin={[5, 22]} expand={1} />
      <hr />
    </div>
  );
};

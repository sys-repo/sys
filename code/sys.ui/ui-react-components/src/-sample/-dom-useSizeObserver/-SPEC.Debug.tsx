import React from 'react';
import { type t, css, Signal } from '../-test.ui.ts';

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
  const api = { rect: s<DOMRectReadOnly>() };
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
    pre: css({ marginLeft: 20, fontSize: 12, fontWeight: 600 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>⚡️ via signal:</div>
      <pre className={styles.pre.class}>{JSON.stringify(rect, null, '  ')}</pre>
      <hr />
    </div>
  );
};

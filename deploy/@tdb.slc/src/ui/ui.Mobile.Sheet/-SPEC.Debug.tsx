import React from 'react';
import { type t, Button, Color, css, Signal } from './common.ts';

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  type P = t.MobileSheetProps;
  const s = Signal.create;
  const props = {
    theme: s<P['theme']>('Dark'),
    showing: s(true),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.theme.value;
      p.showing.value;
    },
  };
  init?.(api);
  return api;
}

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
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{'Mobile Sheet'}</div>
      <Button
        block
        label={`theme: "${p.theme}"`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button block label={`showing: ${p.showing}`} onClick={() => Signal.toggle(p.showing)} />
      <hr />
    </div>
  );
};

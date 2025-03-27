import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, Time, DEFAULTS, rx, Button } from './common.ts';

/**
 * Types
 */
export type DebugProps = {
  ctx: { debug: DebugSignals; landing: t.LandingSignals };
  style?: t.CssValue;
};
export type DebugSignals = ReturnType<typeof createDebugSignals>;
type P = DebugProps;

/**
 * Signals
 */
export function createDebugSignals() {
  const s = Signal.create;
  const props = { theme: s<t.CommonTheme>('Dark') };
  const api = { props };
  return api;
}

/**
 * Component
 */
export const Debug: React.FC<P> = (props) => {
  const { ctx } = props;
  const d = ctx.debug.props;
  const p = ctx.landing.props;

  Signal.useRedrawEffect(() => {
    d.theme.value;
    p.canvasPosition.value;
    p.sidebarVisible.value;
  });

  /**
   * Render:
   */
  const theme = Color.theme(d.theme.value);
  const styles = {
    base: css({}),
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{'Landing-1'}</div>
      <hr />

      <Button
        block
        label={`theme: ${d.theme}`}
        onClick={() => Signal.cycle(d.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={`sidebarVisible: ${p.sidebarVisible}`}
        onClick={() => Signal.toggle(p.sidebarVisible)}
      />

      <hr />

      <Button
        block
        label={`canvasPosition: "${p.canvasPosition}"`}
        onClick={() => {
          Signal.cycle<t.LandingCanvasPosition>(p.canvasPosition, ['Center', 'Center:Bottom']);
        }}
      />

      <hr />
    </div>
  );
};

import React from 'react';
import { Button } from '../Button/mod.ts';
import { type t, Color, css, Signal } from './common.ts';

/**
 * Types:
 */
export type DebugImportStyle = 'Static' | 'Function → Promise';
export type DebugProps = { ctx: { debug: DebugSignals }; style?: t.CssValue };
export type DebugSignals = ReturnType<typeof createDebugSignals>;
type P = DebugProps;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;
  const props = {
    theme: s<t.CommonTheme>('Light'),
    width: s(200),
    color: s<'dark' | 'blue'>('dark'),
    importStyle: s<DebugImportStyle>('Function → Promise'),
  };
  const api = { props };
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<P> = (props) => {
  const { ctx } = props;
  const p = ctx.debug.props;

  Signal.useRedrawEffect(() => {
    p.theme.value;
    p.width.value;
    p.importStyle.value;
  });

  /**
   * Render:
   */
  const theme = Color.theme(p.theme.value);
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        block={true}
        label={`theme: ${p.theme}`}
        onClick={() => Signal.cycle(p.theme, ['Light', 'Dark'])}
      />
      <hr />
      <Button
        block={true}
        label={`width: ${p.width}`}
        onClick={() => (p.width.value = p.width.value === 200 ? 80 : 200)}
      />
      <Button
        block={true}
        label={`import style: ${p.importStyle}`}
        onClick={() => {
          type T = DebugImportStyle;
          Signal.cycle<T>(p.importStyle, ['Static', 'Function → Promise']);
        }}
      />

      <hr />
    </div>
  );
};

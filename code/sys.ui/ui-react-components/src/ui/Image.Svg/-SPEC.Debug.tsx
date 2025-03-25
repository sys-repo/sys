import React from 'react';
import { Button } from '../Button/mod.ts';
import { type t, Color, css, Signal } from './common.ts';

/**
 * Types:
 */
export type DebugImportStyle = 'Static' | 'Function → Promise';
export type DebugImage = 'Small' | 'Larger';
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
    image: s<DebugImage>('Small'),
    fill: s<boolean>(false),
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
    p.image.value;
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
        block
        label={`theme: ${p.theme}`}
        onClick={() => Signal.cycle(p.theme, ['Light', 'Dark'])}
      />
      <Button block label={`fill: ${p.fill}`} onClick={() => Signal.toggle(p.fill)} />
      <hr />
      <Button
        block
        label={`width: ${p.width}`}
        onClick={() => (p.width.value = p.width.value === 200 ? 80 : 200)}
      />
      <Button
        block
        label={`import style: ${p.importStyle}`}
        onClick={() => {
          Signal.cycle<DebugImportStyle>(p.importStyle, ['Static', 'Function → Promise']);
        }}
      />
      <Button
        block={true}
        label={`sample image: ${p.image}`}
        onClick={() => {
          Signal.cycle<DebugImage>(p.image, ['Small', 'Larger']);
        }}
      />

      <hr />
    </div>
  );
};

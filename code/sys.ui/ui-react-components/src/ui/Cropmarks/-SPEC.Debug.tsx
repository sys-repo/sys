import React from 'react';
import { type t, Button, Color, css, Signal } from '../u.ts';
import { type DebugSignals } from './-SPEC.signals.tsx';

/**
 * Component:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;

  Signal.useRedrawEffect(() => {
    p.theme.value;
    p.size.value;
    p.subjectOnly.value;
  });

  /**
   * Render:
   */
  const theme = Color.theme(p.theme.value);
  const styles = {
    base: css({ color: theme.fg }),
  };

  const setSize = (label: string, size?: t.CropmarksSize) => {
    return (
      <Button
        block
        label={`set size: ${label}`}
        onClick={() => {
          p.size.value = size;
        }}
      />
    );
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        block
        label={`theme: ${p.theme}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={`subjectOnly: ${p.subjectOnly}`}
        onClick={() => Signal.toggle(p.subjectOnly)}
      />

      <hr />
      {setSize('<undefined>', undefined)}
      {setSize('center', { mode: 'center' })}
      {setSize('fill', { mode: 'fill', x: true, y: true, margin: [40, 40, 40, 40] })}

      <hr />
      {p.size.value?.mode === 'center' && <DebugCenter debug={debug} />}
      {p.size.value?.mode === 'fill' && <DebugFill debug={debug} />}
    </div>
  );
};

/**
 * Component:
 */
export type DebugFillProps = { debug: DebugSignals; style?: t.CssInput };
export const DebugFill: React.FC<DebugFillProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const size = p.size.value;
  if (size?.mode !== 'fill') return null;

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        block
        label={`size.margin: ${size.margin ?? '<undefined>'}`}
        onClick={() => {
          const current = size.margin[0];
          let next = [40, 40, 40, 40];
          if (current === 40) next = [80, 60, 30, 10];
          if (current === 80) next = [100, 100, 100, 100];
          if (current === 100) next = [40, 40, 40, 40];
          if (current === 40) next = [0, 40, 0, 40];
          if (current === 0) next = [40, 0, 40, 0];
          p.size.value = { ...size, margin: next as t.CssMarginArray };
        }}
      />

      <Button
        block
        label={`size.x: ${size.x}`}
        onClick={() => (p.size.value = { ...size, x: !size.x })}
      />

      <Button
        block
        label={`size.y: ${size.y}`}
        onClick={() => (p.size.value = { ...size, y: !size.y })}
      />
    </div>
  );
};

/**
 * Component:
 */
export type DebugCenterProps = {
  debug: DebugSignals;
  style?: t.CssInput;
};
export const DebugCenter: React.FC<DebugCenterProps> = (props) => {
  const { debug } = props;
  const p = debug.props;

  const size = p.size.value;
  if (size?.mode !== 'center') return null;

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  const sizes = [0, 300, 500];

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        block
        label={`size.width: ${size.width}`}
        onClick={() => {
          const next = cycleNumber(size.width ?? 0, sizes);
          p.size.value = { ...size, width: next };
        }}
      />

      <Button
        block
        label={`size.height: ${size.height}`}
        onClick={() => {
          const next = cycleNumber(size.height ?? 0, sizes);
          p.size.value = { ...size, height: next };
        }}
      />
    </div>
  );
};

/**
 * Helpers
 */
export function cycleNumber(current: number, values: number[]): number {
  const index = values.indexOf(current);
  const nextIndex = index >= 0 ? (index + 1) % values.length : 0;
  return values[nextIndex];
}

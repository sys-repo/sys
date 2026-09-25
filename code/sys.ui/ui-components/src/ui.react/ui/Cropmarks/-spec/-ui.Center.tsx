import type { DebugSignals } from './-SPEC.Debug.tsx';

import React from 'react';
import { Button } from '../../u.ts';
import { type t, css } from '../common.ts';

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
 * Helpers:
 */
function cycleNumber(current: number, values: number[]): number {
  const index = values.indexOf(current);
  const nextIndex = index >= 0 ? (index + 1) % values.length : 0;
  return values[nextIndex];
}

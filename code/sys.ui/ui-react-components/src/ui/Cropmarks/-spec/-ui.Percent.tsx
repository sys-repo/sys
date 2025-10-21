import type { DebugSignals } from './-SPEC.Debug.tsx';

import React from 'react';
import { Button } from '../../u.ts';
import { type t, css } from '../common.ts';

export type DebugPercentProps = {
  debug: DebugSignals;
  style?: t.CssInput;
};
export const DebugPercent: React.FC<DebugPercentProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const size = p.size.value;
  if (size?.mode !== 'percent') return null;

  const styles = { base: css({}) };
  const widths: readonly number[] = [60, 70, 80, 90, 100] as const;
  const heights: readonly number[] = [60, 70, 80, 90, 100] as const;

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        block
        label={`width: ${size.width ? `${size.width}%` : '(auto)'}`}
        onClick={() => {
          const curr = size.width ?? widths[0];
          const idx = widths.indexOf(curr);
          const next = widths[(idx + 1) % widths.length];
          p.size.value = { ...size, width: next };
        }}
      />
      <Button
        block
        label={`height: ${size.height ? `${size.height}%` : '(auto)'}`}
        onClick={() => {
          const curr = size.height ?? heights[0];
          const idx = heights.indexOf(curr);
          const next = heights[(idx + 1) % heights.length];
          p.size.value = { ...size, height: next };
        }}
      />
    </div>
  );
};

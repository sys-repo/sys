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

  /**
   * Sample data:
   */
  const sample = {
    widths: [40, 60, 80, 100],
    heights: [40, 60, 80, 100],
    ratios: [undefined, 1.618, '16/9', '4/3'],
  };

  type MaybePercent = t.Percent | undefined;
  const maxSeq: (t.Percent | undefined)[] = [undefined, 60, 70, 80, 90, 100];
  const nextMaxWidth = (curr?: t.Percent) => nextInSeq<MaybePercent>(maxSeq, curr);
  const nextMaxHeight = (curr?: t.Percent) => nextInSeq<MaybePercent>(maxSeq, curr);

  /**
   * Render:
   */
  const styles = { base: css({}) };
  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        block
        label={() => {
          const v = size.aspectRatio;
          if (v == null) return 'aspectRatio: (none)';
          return `aspectRatio: ${typeof v === 'number' ? v.toFixed(3) : v}`;
        }}
        onClick={() => {
          const next = (curr?: string | number) => {
            const i = sample.ratios.findIndex((v) => norm(v) === norm(curr));
            return sample.ratios[(i + 1) % sample.ratios.length];
          };
          const aspectRatio = next(size.aspectRatio);
          p.size.value = { ...size, aspectRatio };
        }}
      />
      <Button
        block
        label={`width: ${size.width ? `${size.width}%` : '(auto)'}`}
        onClick={() => {
          const curr = size.width ?? sample.widths[0];
          const idx = sample.widths.indexOf(curr);
          const next = sample.widths[(idx + 1) % sample.widths.length];
          p.size.value = { ...size, width: next };
        }}
      />
      <Button
        block
        label={`height: ${size.height ? `${size.height}%` : '(auto)'}`}
        onClick={() => {
          const curr = size.height ?? sample.heights[0];
          const idx = sample.heights.indexOf(curr);
          const next = sample.heights[(idx + 1) % sample.heights.length];
          p.size.value = { ...size, height: next };
        }}
      />
      <Button
        block
        label={`maxWidth: ${size.maxWidth ? `${size.maxWidth}%` : '(auto)'}`}
        onClick={() => {
          const maxWidth = nextMaxWidth(size.maxWidth);
          p.size.value = { ...size, maxWidth };
        }}
      />
      <Button
        block
        label={`maxHeight: ${size.maxHeight ? `${size.maxHeight}%` : '(auto)'}`}
        onClick={() => {
          const maxHeight = nextMaxHeight(size.maxHeight);
          p.size.value = { ...size, maxHeight };
        }}
      />
    </div>
  );
};

/**
 * Helpers:
 */
const norm = (v?: string | number) => (typeof v === 'string' ? v.replace(/\s/g, '') : v);
const nextInSeq = <T,>(seq: readonly T[], curr: T | undefined) => {
  const i = seq.findIndex((v) => v === curr);
  return seq[(i + 1) % seq.length];
};

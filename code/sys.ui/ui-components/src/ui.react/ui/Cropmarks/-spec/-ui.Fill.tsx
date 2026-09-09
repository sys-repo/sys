import type { DebugSignals } from './-SPEC.Debug.tsx';

import React from 'react';
import { Button } from '../../u.ts';
import { type t, css } from '../common.ts';

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

  const cycleBool = (current?: boolean) => {
    if (current === undefined) return true;
    if (current === true) return false;
    return undefined;
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        block
        label={`size.margin: ${size.margin ?? '<undefined>'}`}
        onClick={() => {
          type Margin = number | number[] | undefined;

          const m = size.margin as Margin;
          const isArr = (v: unknown): v is number[] => Array.isArray(v);
          const eq = (a: number[] | undefined, b: number[]) =>
            Array.isArray(a) && a.length === b.length && a.every((v, i) => v === b[i]);

          let next: Margin;

          // Cycle: undefined → [array] → undefined
          if (m === undefined) next = [40, 40, 40, 40];
          else if (isArr(m) && eq(m, [40, 40, 40, 40])) next = [80, 60, 30, 10];
          else if (isArr(m) && eq(m, [80, 60, 30, 10])) next = 100;
          else if (m === 100) next = [40];
          else if (isArr(m) && m.length === 1 && m[0] === 40) next = [0, 40];
          else if (isArr(m) && m.length === 2 && m[0] === 0 && m[1] === 40) next = [40, 0];
          else if (isArr(m) && m.length === 2 && m[0] === 40 && m[1] === 0) next = undefined;
          else next = [40, 40, 40, 40]; // Fallback for any other shape.

          p.size.value = { ...size, margin: next as t.CssMarginArray };
        }}
      />

      <Button
        block
        label={`size.x: ${size.x ?? '<undefined>'}`}
        onClick={() => (p.size.value = { ...size, x: cycleBool(size.x) })}
      />

      <Button
        block
        label={`size.y: ${size.y ?? '<undefined>'}`}
        onClick={() => (p.size.value = { ...size, y: cycleBool(size.y) })}
      />
    </div>
  );
};

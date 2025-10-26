import React from 'react';
import { type t } from './common.ts';
import { gridTracks, normalize } from './u.ts';

export function templateTracks(args: {
  ratios: number[];
  gutter: number;
  orientation: t.Orientation;
  collapsed: boolean;
  onlyIndex?: number;
  n: number;
}) {
  const { ratios, gutter, orientation, collapsed, onlyIndex, n } = args;
  const tracks = React.useMemo(() => {
    return gridTracks(
      collapsed ? oneHot(n, onlyIndex) : ratios,
      collapsed ? 0 : gutter,
      orientation,
    );
  }, [ratios, gutter, orientation, collapsed, n, onlyIndex]);
  return tracks;
}

export const oneHot = (n: number, idx: number | undefined) => {
  const out = Array.from({ length: n }, () => 0);
  if (idx != null && idx >= 0 && idx < n) out[idx] = 1;
  return normalize(out, n);
};

import React from 'react';
import { type t } from './common.ts';
import { gridTracks, normalize } from './u.ts';

export function templateTracks(args: {
  paneCount: number;
  ratios: number[];
  gutter: number;
  orientation: t.Orientation;
  collapsed: boolean;
  onlyIndex?: number;
}) {
  const { ratios, gutter, orientation, collapsed, onlyIndex, paneCount } = args;
  const tracks = React.useMemo(() => {
    return gridTracks(
      collapsed ? oneHot(paneCount, onlyIndex) : ratios,
      collapsed ? 0 : gutter,
      orientation,
    );
  }, [ratios, gutter, orientation, collapsed, paneCount, onlyIndex]);
  return tracks;
}

/**
 * Helpers:
 */
const oneHot = (length: number, idx?: number) => {
  const out = Array.from({ length }, () => 0);
  if (idx != null && idx >= 0 && idx < length) out[idx] = 1;
  return normalize(out, length);
};

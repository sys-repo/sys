type R = { start: number; end: number };

/**
 * Helpers:
 */
export function equalRanges(a: R[], b: R[]) {
  if (a.length !== b.length) return false;
  const sort = (xs: R[]) => [...xs].sort((p, q) => p.start - q.start || p.end - q.end);
  const aa = sort(a),
    bb = sort(b);
  return aa.every((r, i) => r.start === bb[i].start && r.end === bb[i].end);
}

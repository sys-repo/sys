import { type t } from './common.ts';

export const toLinePos: t.YamlRangeLib['toLinePos'] = (text, range): t.YamlLinePosPair => {
  // Normalize the incoming range: use first two numbers only.
  let [start, end] = range as [number, number];
  if (start > end) [start, end] = [end, start]; // tolerate inverted input
  const max = text.length;
  start = Math.max(0, Math.min(start, max));
  end = Math.max(0, Math.min(end, max));

  // Build an index of '\n' positions once (0-based code-unit offsets).
  // We seed with -1 so the math for col stays simple (col = offset - lastNL).
  const newlines: number[] = [-1];
  for (let i = 0; i < max; i++) {
    if (text.charCodeAt(i) === 10) newlines.push(i); // '\n'
  }

  // Rightmost newline strictly before `offset`.
  const lastNLBefore = (offset: number): number => {
    let lo = 0,
      hi = newlines.length - 1,
      ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (newlines[mid] < offset) {
        ans = newlines[mid];
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return ans;
  };

  const posAt = (offset: number): t.Yaml.LinePos => {
    const lastNL = lastNLBefore(offset);
    // line is count of newlines before `offset` + 1 (1-based)
    const line = (lastNL === -1 ? 0 : newlines.indexOf(lastNL)) + 1;
    const col = offset - lastNL; // 1-based because lastNL starts at -1
    return { line, col };
  };

  return [posAt(start), posAt(end)];
};

import type { t } from '../common.ts';
import { Text } from '../m.Fmt.Text/mod.ts';

/**
 * Align fitted label/value pairs without measuring or padding the value column.
 * Caller-owned controls must be complete and independently balanced on each LF-delimited line.
 */
export const pairs: t.CliTable.Pairs = (rows, valueColumn) => {
  const blocks = rows.map(([label, value]) => {
    return fittedPairLines(label.split('\n'), value.split('\n'), valueColumn).join('\n');
  });
  return blocks.join('\n');
};

/** Align fitted columns without losing blank or unmatched continuation lines. */
export function fittedPairLines(
  labelLines: string[],
  valueLines: string[],
  valueColumn: number,
): readonly string[] {
  const lineCount = Math.max(labelLines.length, valueLines.length);

  return Array.from({ length: lineCount }, (_, index) => {
    const label = labelLines[index] ?? '';
    const value = valueLines[index] ?? '';
    return `${Text.Width.padEnd(label, valueColumn)}${value}`;
  });
}

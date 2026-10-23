import type { t } from '../common.ts';
import { Text } from '../m.Fmt.Text/mod.ts';

/**
 * Align fitted label/value pairs without measuring or padding the value column.
 * Caller-owned controls must be complete and independently balanced on each LF-delimited line.
 */
export const pairs: t.CliTable.Pairs = (rows, valueColumn) => {
  const blocks = rows.map(([label, value]) => renderPair(label, value, valueColumn));
  return blocks.join('\n');
};

/**
 * Helpers:
 */
function renderPair(label: string, value: string, valueColumn: number): string {
  const labelLines = label.split('\n');
  const valueLines = value.split('\n');
  const lineCount = Math.max(labelLines.length, valueLines.length);

  const lines = Array.from({ length: lineCount }, (_, index) => {
    const label = labelLines[index] ?? '';
    const value = valueLines[index] ?? '';
    return renderLine(label, value, valueColumn);
  });
  return lines.join('\n');
}

function renderLine(label: string, value: string, valueColumn: number): string {
  const prefix = Text.Width.padEnd(label, valueColumn);
  return `${prefix}${value}`;
}

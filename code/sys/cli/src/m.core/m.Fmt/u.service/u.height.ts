import { Text } from '../../m.Fmt.Text/mod.ts';
import { assertOutputCodeUnits } from '../../m.Fmt.Text/u/u.budget.ts';
import { type composeServiceText, fitServiceText } from './u.layout.ts';
import type { FittedRow, ServiceSection } from './t.internal.ts';

type Compose = typeof composeServiceText;
type TitleOptions = {
  error: boolean;
  hidden: number;
  width?: number;
  compose: Compose;
  check: (length: number) => void;
};

/** Select prefixes of fitted pairs. Physical lines already include both columns and their padding. */
export function compactServiceList(
  sections: ServiceSection<FittedRow>[],
  maxRows: number,
  width: number | undefined,
  compose: Compose,
): string {
  if (maxRows === 0) return '';
  const visible = selectRows(sections, maxRows);
  const output: string[] = [];
  let units = 0;
  const projected = (length: number) => units + (output.length ? 1 : 0) + length;
  const push = (value: string, prefix = '') => {
    units = projected(prefix.length + value.length);
    assertOutputCodeUnits(units);
    output.push(prefix + value);
  };
  for (const [index, { name, rows, urlLabel }] of visible.entries()) {
    const hidden = index === visible.length - 1 ? sections.length - visible.length : 0;
    const error = rows.some((row) => row.kind === 'error') &&
      !rows.some((row) => row.kind === 'error' && row.keep > 0);
    const donor = urlLabel === undefined ? undefined : rows[urlLabel];
    for (const row of rows) {
      if (row.keep === 0) continue;
      if (row.kind === 'title' && (hidden || error)) {
        const prefix = labelPrefix(row);
        const check = (length: number) => assertOutputCodeUnits(projected(prefix.length + length));
        const value = compactTitle(name, row.firstValue, { error, hidden, width, compose, check });
        push(value, prefix);
      } else if (row.kind === 'main' && donor?.keep === 0) {
        push(row.firstValue, labelPrefix(donor));
      } else push(row.lines[0]);
      for (const line of row.lines.slice(1, row.keep)) push(line);
    }
  }
  return output.join('\n');
}

/** Allocate one title per visible service first; ties within each tier use display order. */
function selectRows(sections: ServiceSection<FittedRow>[], maxRows: number) {
  const visible = sections.slice(0, maxRows).map((section) => ({
    ...section,
    rows: section.rows.map((row) => ({ ...row, keep: 0 })),
  }));
  let remaining = maxRows;
  for (const priority of ['title', 'main', 'secondary', 'detail'] as const) {
    if (remaining === 0) break;
    for (const { rows } of visible) {
      for (const row of rows) {
        if (priority !== 'detail' && row.kind !== priority) continue;
        const wanted = priority === 'title' ? 1 : row.lines.length - row.keep;
        const take = Math.min(wanted, remaining);
        row.keep += take;
        remaining -= take;
      }
    }
  }
  return visible;
}

/** Reuse the table's exact fitted label and padding, never parse the rendered text. */
function labelPrefix(row: FittedRow) {
  return row.lines[0].slice(0, row.lines[0].length - row.firstValue.length);
}

function compactTitle(
  source: string,
  original: string,
  { error, hidden, width, compose, check }: TitleOptions,
) {
  const end = source.indexOf('\n');
  const name = end < 0 ? source : source.slice(0, end);
  const cells = Text.Width.measure;
  const room = width ?? Infinity;
  const count = hidden ? ` +${hidden} more` : '';
  const nameWidth = cells(name);
  const state = !error ? '' : nameWidth + ' error'.length <= room ? ' error' : '!';
  const available = room - state.length;
  let value = original;
  const originalWidth = cells(original);
  const countFitsName = count && nameWidth + count.length <= available;
  const dropAnnotation = countFitsName && originalWidth + count.length > available;
  if (state === '!' || originalWidth > available || dropAnnotation) {
    value = name
      ? fitServiceText(name, available, { color: 'white', preferSource: true, check, compose })
      : '';
  }
  const append = (text: string, color: 'yellow' | 'dim') => {
    value += fitServiceText(text, undefined, {
      color,
      compose,
      check: (length) => check(value.length + length),
    });
  };
  if (state) append(state, 'yellow');
  if (count && cells(value) + count.length <= room) append(count, 'dim');
  return value;
}

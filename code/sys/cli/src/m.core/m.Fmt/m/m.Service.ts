// Initialize integrity checks before loading the renderer's other dependencies.
import { assertPresentationAuthority, runPresentationAuthority as run } from '../u/u.authority.ts';
import { c, Is, Num, stripAnsi, type t } from '../common.ts';
import { Text } from '../../m.Fmt.Text/mod.ts';
import {
  addSourceCodeUnits,
  assertLineCount,
  assertOutputCodeUnits,
  assertWidthCollectionLength,
} from '../../m.Fmt.Text/u/u.budget.ts';
import { terminal } from '../../m.Is/u.terminal.ts';
import { size } from '../../m.Screen/u.size.ts';
import { pairs } from '../../m.Table/u.pairs.ts';
import { MAX_TERMINAL_CELLS } from '../../u/u.layout.ts';
import { hr } from '../u/u.hr.ts';
import { encodeHyperlink } from '../u/u.hyperlink.ts';
import {
  composeServiceText,
  fitServiceText,
  type ServiceColor,
  serviceFragment,
  serviceLayout,
} from '../u.service/u.layout.ts';
import { serviceUrlValue, serviceUrlValues } from '../u.service/u.url.ts';
import type { composeUrlPart, ServiceUrlAdmission } from '../u.service/u.url.prepare.ts';
import { displayPath } from './m.Path.ts';

type WriteLine = (line: string) => void;
type Row = {
  readonly label: readonly string[];
  readonly anchor: boolean;
  readonly render: (
    width: number | undefined,
    write: WriteLine,
    check: (length: number) => void,
  ) => void;
};
type Dependencies = {
  readonly terminal: typeof terminal;
  readonly size: typeof size;
  readonly hr?: (options: t.CliFormat.Hr.Options) => string;
  readonly hyperlink?: typeof encodeHyperlink;
  readonly text?: typeof composeServiceText;
  readonly url?: typeof composeUrlPart;
};
type Budget = ReturnType<typeof createBudget>;
type PhysicalLinesOptions = {
  previous?: number;
  split?: (text: string) => string[];
};

const DEPS: Dependencies = { terminal, size };

/**
 * Format service status as text without printing or managing the service.
 */
export const Service: t.CliFormat.Service.Lib = Object.freeze({
  format: (input, options) => formatListWith(DEPS, [input], options),
  formatList: (inputs, options) => formatListWith(DEPS, inputs, options),
});

/** Internal terminal and composition seams; an explicit width skips terminal detection. */
export function formatListWith(
  deps: Dependencies,
  inputs: readonly t.CliFormat.Service.Input[],
  options: t.CliFormat.Service.Options = {},
): string {
  assertPresentationAuthority();
  const count = collectionLength(inputs);
  if (count === 0) return '';
  const width = resolveWidth(deps, options);
  if (width === 0) return '';
  const links = run(() => options.urlHyperlinks === true);
  const budget = createBudget();
  const link = deps.hyperlink ?? encodeHyperlink;
  const compose = deps.text ?? composeServiceText;
  const url = { check: budget.url, compose: deps.url };
  const sections: Row[][] = [];
  // Read by index so caller-supplied iterators cannot change the traversal.
  for (let index = 0; index < count; index += 1) {
    sections.push(rowsOf(run(() => inputs[index]), links, budget, link, compose, url));
  }
  const labels = sections.flatMap((rows) => rows.flatMap((row) => row.label));
  const layout = serviceLayout(labels, width);
  const blocks = sections.map((rows) => {
    const table = rows.map((row) => {
      const pair = budget.pair(layout.reserve);
      const color: ServiceColor = row.anchor ? 'green' : 'dim';
      const style = { color, compose, check: pair.checkLabel };
      for (const line of row.label) {
        pair.label(fitServiceText(line, layout.labelWidth, style));
      }
      row.render(layout.valueWidth, pair.value, pair.checkValue);
      return pair.finish();
    });
    return pairs(table, layout.reserve);
  });
  let separator = '';
  if (blocks.length > 1) {
    const ruleWidth = width ?? Text.Width.max(blocks.flatMap((block) => physicalLines(block)));
    // A fixed one-cell probe measures active ANSI framing without allocating the rule.
    const framing = c.dim(c.gray(' ')).length - 1;
    budget.separators(ruleWidth + framing + 2, blocks.length - 1);
    const renderRule = deps.hr ?? hr;
    const rule = renderRule({ width: ruleWidth, weight: 'dashed' });
    separator = `\n${c.dim(c.gray(rule))}\n`;
  }
  const result = blocks.join(separator);
  assertOutputCodeUnits(result.length);
  assertPresentationAuthority();
  return result;
}

/**
 * Helpers:
 */
function resolveWidth(deps: Dependencies, options: t.CliFormat.Service.Options) {
  const explicit = run(() => options.width);
  if (explicit !== undefined) return normalizedWidth(explicit);
  const isTerminal = run(() => options.terminal) ?? run(() => deps.terminal('stdout'));
  if (!isTerminal) return undefined;
  return normalizedWidth(run(() => deps.size().width));
}

function collectionLength(source: { readonly length: number }): number {
  const length = run(() => source.length);
  if (!Is.number(length) || !Num.Is.finite(length) || length < 0 || Math.floor(length) !== length) {
    throw new TypeError('Cli.Fmt.Service collection length invalid.');
  }
  assertWidthCollectionLength(length);
  return length;
}

function normalizedWidth(width: number): number {
  if (!Num.Is.finite(width)) return 0;
  const value = Math.floor(width);
  return value > 0 && value <= MAX_TERMINAL_CELLS ? value : 0;
}

function rowsOf(
  input: t.CliFormat.Service.Input,
  links: boolean,
  budget: Budget,
  link: typeof encodeHyperlink,
  compose: typeof composeServiceText,
  urlAdmission: ServiceUrlAdmission,
): Row[] {
  const rows: Row[] = [];
  const text = (read: () => string) => budget.source(run(read));
  const optional = (read: () => string | undefined) => {
    const value = run(read);
    return value === undefined ? undefined : budget.source(value);
  };
  const field = (label: string, render: Row['render']) => {
    const indented = budget.label(label, true);
    rows.push({ label: indented, anchor: false, render });
  };
  const valueField = (label: string, value: string, color: ServiceColor = 'gray') => {
    field(label, (width, write, check) => fitLines(value, width, write, check, compose, color));
  };
  const name = text(() => input.name);
  const annotation = optional(() => input.annotation);
  rows.push({
    label: budget.label('service'),
    anchor: true,
    render: (width, write, check) => title(name, annotation, width, write, check, compose),
  });
  const module = optional(() => input.module);
  if (module !== undefined) valueField('module', module);

  const status = run(() => input.status);
  if (status) {
    const state = text(() => status.state);
    if (state !== 'ready') valueField('state', state, stateColor(state));
    const root = optional(() => status.root);
    if (root !== undefined) {
      // Format the supplied path without reading cwd or measuring the terminal again.
      const project = (line: string) => stripAnsi(displayPath(line, { relative: 'bare' }));
      const display = physicalLines(root).map(project);
      field('root', (width, write, check) => {
        for (const line of display) {
          write(fitServiceText(line, width, { check, compose, underline: true }));
        }
      });
    }
    const details = run(() => status.details);
    const count = details ? collectionLength(details) : 0;
    const format = count > 0 ? presentationOf(input) : undefined;
    // Keep the original detail objects so HTTP can distinguish supplied and generated rows.
    for (let index = 0; index < count; index += 1) {
      const detail = run(() => details![index]);
      const label = text(() => detail.label);
      const value = text(() => detail.value);
      field(label, (width, write, check) => {
        detailValue(detail, value, format, width, budget, write, check, compose);
      });
    }
    const error = run(() => status.error);
    if (error) {
      const name = text(() => error.name);
      const message = text(() => error.message);
      assertOutputCodeUnits(name.length + 2 + message.length);
      valueField('error', `${name}: ${message}`, 'yellow');
    }
    const urls = run(() => status.urls);
    const urlCount = urls ? collectionLength(urls) : 0;
    const captured: t.Service.Url[] = [];
    for (let index = 0; index < urlCount; index += 1) {
      const url = run(() => urls![index]);
      captured.push({ href: text(() => url.href) });
    }
    const policy = run(() => input.urlDisplay);
    const ipv4Loopback = policy ? run(() => policy.ipv4Loopback) : undefined;
    serviceUrlValues(captured, { ipv4Loopback }, urlAdmission).forEach((url, index) => {
      field(index === 0 ? 'url' : '', (width, write, check) => {
        write(serviceUrlValue(url, width, links, check, link, compose));
      });
    });
  }
  const keyboard = run(() => input.keyboard);
  if (keyboard) {
    const open = optional(() => keyboard.open);
    const quit = optional(() => keyboard.quit);
    if (open) valueField('open', open, 'dim');
    if (quit) valueField('quit', quit, 'dim');
  }
  return rows;
}

function presentationOf(
  input: t.CliFormat.Service.Input,
): t.CliFormat.Service.FormatDetail | undefined {
  const presentation = run(() => input.presentation);
  if (presentation === undefined) return;
  if (!Is.record(presentation)) {
    throw new TypeError('Cli.Fmt.Service presentation must be an object.');
  }
  const format = run(() => presentation.formatDetail);
  if (format !== undefined && !Is.func(format)) {
    throw new TypeError('Cli.Fmt.Service formatDetail must be a function.');
  }
  return format;
}

function detailValue(
  detail: t.Service.Detail,
  plain: string,
  format: t.CliFormat.Service.FormatDetail | undefined,
  width: number | undefined,
  budget: Budget,
  write: WriteLine,
  check: (length: number) => void,
  compose: typeof composeServiceText,
): void {
  const rich = format ? run(() => format({ detail, maxWidth: width })) : undefined;
  if (rich !== undefined) {
    if (!Is.str(rich)) {
      throw new TypeError('Cli.Fmt.Service formatDetail must return a string or undefined.');
    }
    budget.source(rich);
    const lines = physicalLines(rich);
    // Keep integrity and size checks active even when there is no width limit.
    const widths = lines.map((line) => Text.Width.measure(line));
    if (width === undefined || widths.every((cells) => cells <= width)) {
      for (const line of lines) write(line);
      return;
    }
  }
  fitLines(plain, width, write, check, compose);
}

function fitLines(
  value: string,
  width: number | undefined,
  write: WriteLine,
  check: (length: number) => void,
  compose: typeof composeServiceText,
  color: ServiceColor = 'gray',
): void {
  for (const line of physicalLines(value)) {
    write(fitServiceText(line, width, { check, compose, color }));
  }
}

function title(
  name: string,
  annotation: string | undefined,
  width: number | undefined,
  write: WriteLine,
  check: (length: number) => void,
  compose: typeof composeServiceText,
): void {
  assertOutputCodeUnits(name.length + (annotation ? annotation.length + 1 : 0));
  const text = annotation ? `${name} ${annotation}` : name;
  let offset = 0;
  for (const line of physicalLines(text)) {
    const start = offset;
    offset += line.length + 1; // Include the LF when locating the next line in the original text.
    const value = fitServiceText(line, width, {
      check,
      compose,
      fragments(fragment, position) {
        const from = start + position;
        return [
          ...serviceFragment(fragment, from, 0, name.length, 'white'),
          ...serviceFragment(fragment, from, name.length, name.length + 1, 'plain'),
          ...serviceFragment(fragment, from, name.length + 1, text.length, 'annotation'),
        ];
      },
    });
    write(value);
  }
}

function stateColor(state: string): ServiceColor {
  if (state === 'error') return 'yellow';
  return state === 'stopped' ? 'gray' : 'white';
}

/** Internal LF admission boundary; the splitter seam exposes allocation order without patching globals. */
export function physicalLines(text: string, options: PhysicalLinesOptions = {}): string[] {
  const previous = options.previous ?? 0;
  let count = 1;
  assertWidthCollectionLength(previous + count);
  // Count only to the admitted limit; neither this scan nor its guards construct a line collection.
  let cursor = text.indexOf('\n');
  while (cursor !== -1) {
    count += 1;
    assertLineCount(count);
    assertWidthCollectionLength(previous + count);
    cursor = text.indexOf('\n', cursor + 1);
  }
  const split = options.split ?? splitPhysicalLines;
  return split(text);
}

function splitPhysicalLines(text: string): string[] {
  return text.split('\n');
}

/** Limit total service and callback text, including table padding and separators. */
function createBudget() {
  let source = 0;
  let output = 0;
  let lines = 0;
  let labels = 0;
  let labelUnits = 0;
  let urls = 0;
  const addOutput = (length: number) => {
    assertOutputCodeUnits(output + length);
    output += length;
  };
  const addLine = (length: number) => {
    assertLineCount(lines + 1);
    addOutput(length + (lines === 0 ? 0 : 1));
    lines += 1;
  };
  return {
    source(text: string): string {
      if (!Is.str(text)) throw new TypeError('Cli.Fmt.Service facts must be strings.');
      source = addSourceCodeUnits(source, text);
      return text;
    },
    label(text: string, indent = false): string[] {
      const admitted = physicalLines(text, { previous: labels });
      labels += admitted.length;
      return admitted.map((line) => {
        const prefix = indent && line ? ' ' : '';
        assertOutputCodeUnits(labelUnits + prefix.length + line.length);
        labelUnits += prefix.length + line.length;
        return `${prefix}${line}`;
      });
    },
    url(length: number) {
      assertOutputCodeUnits(urls + length);
      urls += length;
    },
    pair(reserve: number) {
      const left: string[] = [];
      const right: string[] = [];
      // Check each line's padded size before storing it.
      return {
        checkLabel(length: number, cells: number) {
          assertLineCount(lines + 1);
          const padding = Math.max(0, reserve - cells);
          assertOutputCodeUnits(output + length + padding + (lines === 0 ? 0 : 1));
        },
        label(line: string) {
          addLine(line.length + Math.max(0, reserve - Text.Width.measure(line)));
          left.push(line);
        },
        // Preflight composition without charging; value() records the actual output once.
        checkValue(length: number) {
          if (right.length < left.length) {
            assertOutputCodeUnits(output + length);
            return;
          }
          assertLineCount(lines + 1);
          assertOutputCodeUnits(output + reserve + length + (lines === 0 ? 0 : 1));
        },
        value(line: string) {
          if (right.length < left.length) addOutput(line.length);
          else addLine(reserve + line.length);
          right.push(line);
        },
        finish(): t.CliTable.Pair {
          return [left.join('\n'), right.join('\n')];
        },
      };
    },
    separators(length: number, count: number) {
      lines += count;
      assertLineCount(lines);
      // pair() already counted one newline between blocks.
      addOutput((length - 1) * count);
    },
  };
}

import { c, Str, type t } from '../common.ts';
import { Text } from '../../m.Fmt.Text/mod.ts';

const DEFAULT_PAGE_WIDTH = 120;
const DEFAULT_MIN_BODY_WIDTH = 20;

const GAP = '   ';
const HANGING_INDENT = 2;

type Layout = {
  readonly gap: string;
  readonly labelWidth: number;
  readonly pageWidth: number;
  readonly minBodyWidth: number;
};

export const Help: t.CliFormatHelp.Lib = Object.freeze({
  build(input: t.CliFormatHelp.Input) {
    const sections = wrangle.sections(input);
    const layout = wrangle.layout(input, sections);
    const lines = [`  ${c.bold(c.brightCyan(input.tool))}`];

    if (input.summary) lines.push('', ...wrapTopMatter(input.summary, layout, 'default'));
    if (input.note) lines.push(...wrapTopMatter(input.note, layout, 'muted'));

    for (const section of sections) {
      const text = renderSection(section, layout);
      if (text) lines.push('', text);
    }

    return `\n${Str.trimEdgeNewlines(lines.join('\n'))}\n`;
  },

  render(input: t.CliFormatHelp.Input) {
    console.info(Help.build(input));
  },
});

function renderSection(section: t.CliFormatHelp.Section, layout: Layout): string {
  if (section.items.length === 0) return '';
  if (section.kind === 'pairs') return renderPairsSection(section, layout);
  return renderLinesSection(section, layout);
}

function renderLinesSection(
  section: Extract<t.CliFormatHelp.Section, { kind: 'lines' }>,
  layout: Layout,
): string {
  const labelWidth = layout.labelWidth;
  const label = c.gray(Text.Width.padEnd(section.label, labelWidth));
  const blank = ' '.repeat(labelWidth);
  const bodyWidth = Text.Width.fit({
    width: layout.pageWidth,
    reserve: labelWidth + Text.Width.measure(layout.gap),
    minWidth: layout.minBodyWidth,
  });
  if (bodyWidth === 0) return renderStackedLinesSection(section, layout);

  const lines = section.items.flatMap((item, itemIndex) => {
    const wrapped = Text.Wrap.lines(item, {
      width: bodyWidth,
      continuationIndent: HANGING_INDENT,
    });

    return wrapped.map((line, lineIndex) => {
      const left = itemIndex === 0 && lineIndex === 0 ? label : blank;
      return `${left}${layout.gap}${tone(section.tone ?? 'default', line)}`;
    });
  });

  return Str.trimEdgeNewlines(lines.join('\n'));
}

function renderPairsSection(
  section: Extract<t.CliFormatHelp.Section, { kind: 'pairs' }>,
  layout: Layout,
): string {
  const leftTone = section.leftTone ?? 'muted';
  const rightTone = section.rightTone ?? 'default';
  const labelWidth = layout.labelWidth;
  const leftValues = section.items.map(([left]) => left);
  const leftWidth = Text.Width.max(leftValues);
  const label = c.gray(Text.Width.padEnd(section.label, labelWidth));
  const sectionBlank = ' '.repeat(labelWidth);
  const leftBlank = ' '.repeat(leftWidth);
  const rightWidth = Text.Width.fit({
    width: layout.pageWidth,
    reserve: labelWidth +
      Text.Width.measure(layout.gap) +
      leftWidth +
      Text.Width.measure(layout.gap),
    minWidth: layout.minBodyWidth,
  });
  if (rightWidth === 0) return renderStackedPairsSection(section, layout);

  const lines = section.items.flatMap(([leftValue, right], itemIndex) => {
    const wrapped = Text.Wrap.lines(right, {
      width: rightWidth,
      continuationIndent: HANGING_INDENT,
    });

    return wrapped.map((line, lineIndex) => {
      const sectionLabel = itemIndex === 0 && lineIndex === 0 ? label : sectionBlank;
      const left = lineIndex === 0
        ? tone(leftTone, Text.Width.padEnd(leftValue, leftWidth))
        : leftBlank;
      return `${sectionLabel}${layout.gap}${left}${layout.gap}${tone(rightTone, line)}`;
    });
  });

  return Str.trimEdgeNewlines(lines.join('\n'));
}

function renderStackedLinesSection(
  section: Extract<t.CliFormatHelp.Section, { kind: 'lines' }>,
  layout: Layout,
): string {
  const lines = [
    c.gray(section.label),
    ...section.items.flatMap((item) => {
      return Text.Wrap.lines(item, {
        width: Math.max(0, layout.pageWidth - HANGING_INDENT),
        indent: HANGING_INDENT,
        continuationIndent: HANGING_INDENT,
      }).map((line) => tone(section.tone ?? 'default', line));
    }),
  ];

  return Str.trimEdgeNewlines(lines.join('\n'));
}

function renderStackedPairsSection(
  section: Extract<t.CliFormatHelp.Section, { kind: 'pairs' }>,
  layout: Layout,
): string {
  const leftTone = section.leftTone ?? 'muted';
  const rightTone = section.rightTone ?? 'default';
  const lines = [
    c.gray(section.label),
    ...section.items.flatMap(([left, right]) => {
      return [
        ...Text.Wrap.lines(left, {
          width: Math.max(0, layout.pageWidth - HANGING_INDENT),
          indent: HANGING_INDENT,
          continuationIndent: HANGING_INDENT,
        }).map((line) => tone(leftTone, line)),
        ...Text.Wrap.lines(right, {
          width: Math.max(0, layout.pageWidth - HANGING_INDENT * 2),
          indent: HANGING_INDENT * 2,
          continuationIndent: HANGING_INDENT * 2,
        }).map((line) => tone(rightTone, line)),
      ];
    }),
  ];

  return Str.trimEdgeNewlines(lines.join('\n'));
}

function wrapTopMatter(
  input: string,
  layout: Layout,
  toneKind: t.CliFormatHelp.Tone,
): readonly string[] {
  return Text.Wrap.lines(input, { width: layout.pageWidth }).map((line) => tone(toneKind, line));
}

function tone(kind: t.CliFormatHelp.Tone, input: string): string {
  return kind === 'muted' ? c.gray(input) : c.white(input);
}

const wrangle = {
  layout(input: t.CliFormatHelp.Input, sections: readonly t.CliFormatHelp.Section[]): Layout {
    const labels = sections
      .filter((section) => section.items.length > 0)
      .map((section) => section.label);
    const options = input.layout ?? {};

    return {
      gap: GAP,
      labelWidth: Text.Width.max(labels),
      pageWidth: Text.Width.fit({
        ...options,
        maxWidth: options.maxWidth ?? DEFAULT_PAGE_WIDTH,
        fallbackWidth: options.fallbackWidth ?? DEFAULT_PAGE_WIDTH,
      }),
      minBodyWidth: Math.max(0, Math.floor(options.minBodyWidth ?? DEFAULT_MIN_BODY_WIDTH)),
    };
  },

  sections(input: t.CliFormatHelp.Input): readonly t.CliFormatHelp.Section[] {
    if (input.sections) return input.sections;

    const sections: t.CliFormatHelp.Section[] = [];

    if (input.usage?.length) {
      sections.push({ kind: 'lines', label: 'Usage', items: input.usage });
    }

    if (input.options?.length) {
      sections.push({ kind: 'pairs', label: 'Options', items: input.options });
    }

    if (input.examples?.length) {
      sections.push({ kind: 'lines', label: 'Examples', items: input.examples, tone: 'muted' });
    }

    return sections;
  },
} as const;

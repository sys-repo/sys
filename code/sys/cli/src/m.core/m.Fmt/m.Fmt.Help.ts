import { c, Str, stripAnsi, type t } from '../common.ts';

type Layout = {
  readonly gap: string;
  readonly labelWidth: number;
};

export const Help: t.CliFormat.Lib['Help'] = {
  build(input: t.CliFormatHelpInput) {
    const lines = [`  ${c.bold(c.brightCyan(input.tool))}`];

    if (input.summary) lines.push('', c.white(input.summary));
    if (input.note) lines.push(c.gray(input.note));

    const sections = wrangle.sections(input);
    const layout = wrangle.layout(sections);
    for (const section of sections) {
      const text = renderSection(section, layout);
      if (text) lines.push('', text);
    }

    return `\n${Str.trimEdgeNewlines(lines.join('\n'))}\n`;
  },

  render(input: t.CliFormatHelpInput) {
    console.info(Help.build(input));
  },
};

function renderSection(section: t.CliFormatHelpSection, layout: Layout): string {
  if (section.items.length === 0) return '';
  if (section.kind === 'pairs') return renderPairsSection(section, layout);
  return renderLinesSection(section, layout);
}

function renderLinesSection(
  section: Extract<t.CliFormatHelpSection, { kind: 'lines' }>,
  layout: Layout,
): string {
  const labelWidth = layout.labelWidth;
  const label = c.gray(padVisibleEnd(section.label, labelWidth));
  const blank = ' '.repeat(labelWidth);
  const lines = section.items.map((item, index) => {
    const left = index === 0 ? label : blank;
    const right = tone(section.tone ?? 'default', item);
    return `${left}${layout.gap}${right}`;
  });

  return Str.trimEdgeNewlines(lines.join('\n'));
}

function renderPairsSection(
  section: Extract<t.CliFormatHelpSection, { kind: 'pairs' }>,
  layout: Layout,
): string {
  const leftTone = section.leftTone ?? 'muted';
  const rightTone = section.rightTone ?? 'default';
  const labelWidth = layout.labelWidth;
  const leftValues = section.items.map(([left]) => left);
  const leftWidth = maxVisibleWidth(leftValues);
  const label = c.gray(padVisibleEnd(section.label, labelWidth));
  const blank = ' '.repeat(labelWidth);
  const lines = section.items.map(([leftValue, right], index) => {
    const sectionLabel = index === 0 ? label : blank;
    const left = tone(leftTone, padVisibleEnd(leftValue, leftWidth));
    return `${sectionLabel}${layout.gap}${left}${layout.gap}${tone(rightTone, right)}`;
  });

  return Str.trimEdgeNewlines(lines.join('\n'));
}

function visibleWidth(input: string): number {
  return stripAnsi(input).length;
}

function maxVisibleWidth(inputs: readonly string[]): number {
  return inputs.reduce((max, input) => Math.max(max, visibleWidth(input)), 0);
}

function padVisibleEnd(input: string, width: number): string {
  return `${input}${' '.repeat(Math.max(0, width - visibleWidth(input)))}`;
}

function tone(kind: t.CliFormatHelpTone, input: string): string {
  return kind === 'muted' ? c.gray(input) : c.white(input);
}

const wrangle = {
  layout(sections: readonly t.CliFormatHelpSection[]): Layout {
    const labels = sections
      .filter((section) => section.items.length > 0)
      .map((section) => section.label);

    return {
      gap: '   ',
      labelWidth: maxVisibleWidth(labels),
    };
  },

  sections(input: t.CliFormatHelpInput): readonly t.CliFormatHelpSection[] {
    if (input.sections) return input.sections;

    const sections: t.CliFormatHelpSection[] = [];

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

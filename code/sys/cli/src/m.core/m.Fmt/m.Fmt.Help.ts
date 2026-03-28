import { c, Str, type t } from '../common.ts';
import { Table } from '../m.Table/mod.ts';

export const Help: t.CliFormatLib['Help'] = {
  build(input: t.CliFormatHelpInput) {
    const lines = [c.bold(c.brightCyan(input.tool))];

    if (input.summary) lines.push('', c.white(input.summary));
    if (input.note) lines.push(c.gray(input.note));

    const sections = wrangle.sections(input);
    for (const section of sections) {
      const text = renderSection(section);
      if (text) lines.push('', text);
    }

    return Str.trimEdgeNewlines(lines.join('\n'));
  },

  render(input: t.CliFormatHelpInput) {
    console.info(Help.build(input));
  },
};

function renderSection(section: t.CliFormatHelpSection): string {
  if (section.items.length === 0) return '';
  if (section.kind === 'pairs') return renderPairsSection(section);
  return renderLinesSection(section);
}

function renderLinesSection(section: Extract<t.CliFormatHelpSection, { kind: 'lines' }>): string {
  const table = Table.create([]);

  section.items.forEach((item, index) => {
    table.push([index === 0 ? c.gray(section.label) : '', tone(section.tone ?? 'default', item)]);
  });

  return Str.trimEdgeNewlines(String(table));
}

function renderPairsSection(section: Extract<t.CliFormatHelpSection, { kind: 'pairs' }>): string {
  const table = Table.create([]);
  table.push([c.gray(section.label), '']);

  for (const [left, right] of section.items) {
    table.push([
      tone(section.leftTone ?? 'muted', `  ${left}`),
      tone(section.rightTone ?? 'default', right),
    ]);
  }

  return Str.trimEdgeNewlines(String(table));
}

function tone(kind: t.CliFormatHelpTone, input: string): string {
  return kind === 'muted' ? c.gray(input) : c.white(input);
}

const wrangle = {
  sections(input: t.CliFormatHelpInput): readonly t.CliFormatHelpSection[] {
    if (input.sections) return input.sections;

    const sections: t.CliFormatHelpSection[] = [];

    if (input.usage?.length) {
      sections.push({
        kind: 'lines',
        label: 'Usage',
        items: input.usage,
      });
    }

    if (input.options?.length) {
      sections.push({
        kind: 'pairs',
        label: 'Options',
        items: input.options,
      });
    }

    if (input.examples?.length) {
      sections.push({
        kind: 'lines',
        label: 'Examples',
        items: input.examples,
        tone: 'muted',
      });
    }

    return sections;
  },
} as const;

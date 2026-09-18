import { c, Fs, Is, Str, type t } from '../common.ts';
import { FmtFields } from './u.fields.ts';
import { currentFitContext, type FitContext, FmtFit } from './u.fit.ts';

export const FmtInfo = Object.freeze(
  {
    cell(report: t.CellCli.Info.Report): string {
      return cellWith(currentFitContext(), report);
    },
  } as const,
);

export function cellWith(context: FitContext, report: t.CellCli.Info.Report): string {
  const sections = infoSections(report);
  const labelWidth = FmtFields.labelWidth(
    sections.flatMap((section) => section.blocks).flatMap(
      (block) => block.rows.map(([label]) => label),
    ),
  );
  const text = sections.map((section) => renderSection(section, labelWidth, context)).join('\n\n');
  return `\n${Str.trimEdgeNewlines(text)}\n`;
}

/**
 * Helpers:
 */
type InfoRowKind = 'path' | 'path-bare' | 'subtle' | 'highlight' | 'steps' | 'none';
type InfoRow = readonly [label: string, value: string, kind?: InfoRowKind];

type InfoBlock = {
  readonly title?: string;
  readonly rows: readonly InfoRow[];
};

type InfoSection = {
  readonly title: string;
  readonly blocks: readonly InfoBlock[];
};

function infoSections(report: t.CellCli.Info.Report): readonly InfoSection[] {
  return [
    { title: 'Cell', blocks: [{ rows: cellRows(report) }] },
    serviceSection(report.services),
    taskSection(report.tasks),
  ];
}

function cellRows(report: t.CellCli.Info.Report): readonly InfoRow[] {
  return [
    ['root', displayRoot(report.root), 'path'],
    ['descriptor', report.descriptor, 'path-bare'],
    ...(report.name === undefined ? [] : [['name', report.name, 'highlight'] as const]),
    ['version', String(report.version), 'subtle'],
  ];
}

function serviceSection(services: readonly t.Cell.Services.Service[]): InfoSection {
  if (services.length === 0) return { title: 'Services', blocks: [noneBlock()] };
  return { title: 'Services', blocks: services.map(serviceBlock) };
}

function serviceBlock(service: t.Cell.Services.Service): InfoBlock {
  const modes = Object.keys(service.variants ?? {});
  return {
    title: service.name,
    rows: [
      ['use', service.use],
      ['from', service.from, 'subtle'],
      ['config', service.config, 'path-bare'],
      ...(modes.length > 0 ? [['modes', modes.join(', '), 'highlight'] as const] : []),
    ],
  };
}

function taskSection(tasks: readonly t.Cell.Task.Descriptor[]): InfoSection {
  if (tasks.length === 0) return { title: 'Tasks', blocks: [noneBlock()] };
  return { title: 'Tasks', blocks: tasks.map(taskBlock) };
}

function taskBlock(task: t.Cell.Task.Descriptor): InfoBlock {
  return {
    title: task.name,
    rows: isCompositeTask(task) ? compositeTaskRows(task) : leafTaskRows(task),
  };
}

function leafTaskRows(task: t.Cell.Task.Leaf): readonly InfoRow[] {
  return [
    ['use', task.use],
    ['from', task.from, 'subtle'],
    ...(task.config ? [['config', task.config, 'path-bare'] as const] : []),
  ];
}

function compositeTaskRows(task: t.Cell.Task.Composite): readonly InfoRow[] {
  return [['steps', task.steps.map((step) => step.task).join(' → '), 'steps']];
}

function noneBlock(): InfoBlock {
  return { rows: [['', 'none', 'none']] };
}

function renderSection(section: InfoSection, labelWidth: number, context: FitContext): string {
  const blocks = section.blocks.map((block) => renderBlock(block, labelWidth, context)).join(
    '\n\n',
  );
  return [FmtFields.title(section.title), blocks].filter(Boolean).join('\n');
}

function renderBlock(block: InfoBlock, labelWidth: number, context: FitContext): string {
  const title = block.title ? `${FmtFields.indent(1)}${c.white(block.title)}` : '';
  const rows = renderRows(block.rows, labelWidth, block.title ? 2 : 1, context);
  return [title, rows].filter(Boolean).join('\n');
}

function renderRows(
  rows: readonly InfoRow[],
  labelWidth: number,
  level: 1 | 2,
  context: FitContext,
): string {
  if (rows.length === 0) return '';

  return rows.map(([label, value, kind]) => {
    const rowIndent = FmtFields.indent(level);
    if (!label) return `${rowIndent}${formatValue(value, kind, rowIndent.length, context)}`;

    const gap = '   ';
    const tone = level === 1 ? 'gray' : 'dim';
    const paddedLabel = FmtFields.label(label, labelWidth, { tone });
    const reserve = rowIndent.length + labelWidth + gap.length;
    return `${rowIndent}${paddedLabel}${gap}${formatValue(value, kind, reserve, context)}`;
  }).join('\n');
}

function formatValue(
  value: string,
  kind: InfoRow[2],
  reserve: number,
  context: FitContext,
): string {
  if (kind === 'path') return pathValue(value, reserve, context);
  if (kind === 'path-bare') return pathValue(value, reserve, context, 'bare');
  if (kind === 'subtle') return FmtFit.value(value, reserve, { ...context, color: c.gray });
  if (kind === 'highlight') return FmtFit.value(value, reserve, { ...context, color: c.cyan });
  if (kind === 'steps') return stepValue(value, reserve, context);
  if (kind === 'none') return c.gray(c.italic(value));
  return FmtFit.value(value, reserve, { ...context, color: c.white });
}

function stepValue(value: string, reserve: number, context: FitContext): string {
  const steps = value.split(' → ');
  const width = FmtFit.valueWidth(reserve, context);
  const fitsOneLine = !context.terminal || width === 0 || value.length <= width;

  if (fitsOneLine) return inlineSteps(value);

  const [first = '', ...rest] = steps;
  const continuation = ' '.repeat(reserve);
  return [
    stepName(first, width),
    ...rest.map((step) => `${continuation}${c.cyan('→')} ${stepName(step, width - 2)}`),
  ].join('\n');
}

function stepName(value: string, width: number): string {
  return FmtFit.text(value, width, { color: c.white });
}

function inlineSteps(value: string): string {
  return value.split('→').map((part) => c.white(part)).join(c.cyan('→'));
}

function pathValue(
  path: string,
  reserve: number,
  context: FitContext,
  relative: 'bare' | 'prefixed' = 'prefixed',
) {
  return FmtFit.path(path, reserve, { ...context, relative });
}

function displayRoot(root: string): string {
  const trimmed = Fs.trimCwd(root, { prefix: true });
  if (!trimmed || trimmed === './') return '.';
  return trimmed;
}

function isCompositeTask(task: t.Cell.Task.Descriptor): task is t.Cell.Task.Composite {
  return Is.object(task) && 'steps' in task;
}

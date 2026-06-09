import { Cli, CliTable, Fs, Is, Str, stripAnsi, type t } from '../common.ts';

export const FmtInfo = {
  cell(report: t.CellCli.Info.Report): string {
    const sections = infoSections(report);
    const labelWidth = maxLabelWidth(sections.flatMap((section) => section.rows));
    const text = sections.map((section) => renderSection(section, labelWidth)).join('\n\n');
    return `\n${Str.trimEdgeNewlines(text)}\n`;
  },
} as const;

/**
 * Helpers:
 */
type InfoRow = readonly [label: string, value: string, kind?: 'path' | 'path-bare'];

type InfoSection = {
  readonly title?: string;
  readonly rows: readonly InfoRow[];
};

function infoSections(report: t.CellCli.Info.Report): readonly InfoSection[] {
  return [
    { title: 'Cell', rows: cellRows(report) },
    ...serviceSections(report.services),
    ...taskSections(report.tasks),
  ];
}

function cellRows(report: t.CellCli.Info.Report): readonly InfoRow[] {
  return [
    ['root', displayRoot(report.root), 'path'],
    ['descriptor', report.descriptor, 'path-bare'],
    ['version', String(report.version)],
  ];
}

function serviceSections(services: readonly t.Cell.Services.Service[]): readonly InfoSection[] {
  if (services.length === 0) return [{ rows: [['Services', 'none']] }];

  return [{ title: 'Services', rows: [] }, ...services.map(serviceSection)];
}

function serviceSection(service: t.Cell.Services.Service): InfoSection {
  const modes = Object.keys(service.variants ?? {});
  return {
    title: service.name,
    rows: [
      ['  use', service.use],
      ['  from', service.from],
      ['  config', service.config, 'path-bare'],
      ...(modes.length > 0 ? [['  modes', modes.join(', ')] as const] : []),
    ],
  };
}

function taskSections(tasks: readonly t.Cell.Task.Descriptor[]): readonly InfoSection[] {
  if (tasks.length === 0) return [{ rows: [['Tasks', 'none']] }];

  return [{ title: 'Tasks', rows: [] }, ...tasks.map(taskSection)];
}

function taskSection(task: t.Cell.Task.Descriptor): InfoSection {
  return {
    title: task.name,
    rows: isCompositeTask(task) ? compositeTaskRows(task) : leafTaskRows(task),
  };
}

function leafTaskRows(task: t.Cell.Task.Leaf): readonly InfoRow[] {
  return [
    ['  use', task.use],
    ['  from', task.from],
    ...(task.config ? [['  config', task.config, 'path-bare'] as const] : []),
  ];
}

function compositeTaskRows(task: t.Cell.Task.Composite): readonly InfoRow[] {
  return [['  steps', task.steps.map((step) => step.task).join(' → ')]];
}

function renderSection(section: InfoSection, labelWidth: number): string {
  const parts = [section.title, renderRows(section.rows, labelWidth)].filter(Boolean);
  return parts.join('\n\n');
}

function renderRows(rows: readonly InfoRow[], labelWidth: number): string {
  if (rows.length === 0) return '';

  const reserve = labelWidth + CliTable.cellGap;
  const table = CliTable.create([]);
  rows.forEach(([label, value, kind]) => {
    table.push([padLabel(label, labelWidth), formatValue(value, kind, reserve)]);
  });
  return Str.trimEdgeNewlines(String(table));
}

function formatValue(value: string, kind: InfoRow[2], reserve: number): string {
  if (kind === 'path') return pathValue(value, reserve);
  if (kind === 'path-bare') return pathValue(value, reserve, 'bare');
  return value;
}

function pathValue(path: string, reserve: number, relative: 'bare' | 'prefixed' = 'prefixed') {
  return Cli.Fmt.Path.tty(path, {
    reserve,
    relative,
    terminal: Cli.Is.terminal('stdout'),
    width: Cli.Screen.size().width,
    min: 1,
    highlightBasename: false,
  });
}

function displayRoot(root: string): string {
  const trimmed = Fs.trimCwd(root, { prefix: true });
  if (!trimmed || trimmed === './') return '.';
  return trimmed;
}

function maxLabelWidth(rows: readonly InfoRow[]): number {
  return rows.reduce((max, [label]) => Math.max(max, stripAnsi(label).length), 0);
}

function padLabel(label: string, width: number): string {
  const pad = Math.max(0, width - stripAnsi(label).length);
  return `${label}${' '.repeat(pad)}`;
}

function isCompositeTask(task: t.Cell.Task.Descriptor): task is t.Cell.Task.Composite {
  return Is.object(task) && 'steps' in task;
}

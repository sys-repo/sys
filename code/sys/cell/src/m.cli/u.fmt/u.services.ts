import type { StartedServiceStatus } from '../../m.cell/u.services/u.status.ts';
import { c, Cli, Fs, Is, Str, stripAnsi, type t } from '../common.ts';
import { FmtFit } from './u.fit.ts';

type ServicesStartedResult = {
  services: readonly StartedServiceStatus[];
};

type ServiceStatusKind = 'title' | 'subtle' | 'path' | 'state' | 'error' | 'url' | 'url-muted';
type ServiceLabelKind = 'anchor' | 'field' | 'blank';

type ServiceStatusRow = {
  readonly label: string;
  readonly labelKind: ServiceLabelKind;
  readonly value: string;
  readonly kind: ServiceStatusKind;
  readonly url?: t.CliFormat.Url.ServicePart;
};

export const FmtServices = {
  started(res: ServicesStartedResult): string {
    const blocks = res.services.map(serviceStatusRows);
    if (blocks.length === 0) return '';
    const labelWidth = maxLabelWidth(blocks.flat());
    const text = blocks.map((rows) => renderServiceStatus(rows, labelWidth)).join(
      `\n${serviceDivider()}\n`,
    );
    return `\n${Str.trimEdgeNewlines(text)}\n`;
  },
} as const;

/**
 * Helpers:
 */
function serviceStatusRows(service: StartedServiceStatus): ServiceStatusRow[] {
  const rows: ServiceStatusRow[] = [];
  const owner = service.owner;

  rows.push(anchorRow('service', serviceTitleText(service)));
  rows.push(fieldRow('module', service.service.from, 'subtle'));

  if (owner) {
    if (owner.state !== 'ready') rows.push(fieldRow('state', owner.state, 'state'));
    if (Is.str(owner.root)) pushServiceRoot(rows, owner.root);
    for (const detail of serviceDetails(owner)) {
      rows.push(fieldRow(detail.label, detail.value, 'subtle'));
    }
    if (Is.stdError(owner.error)) {
      rows.push(fieldRow('error', `${owner.error.name}: ${owner.error.message}`, 'error'));
    }
    pushServiceUrls(rows, serviceUrls(owner));
  }

  return rows;
}

function renderServiceStatus(rows: readonly ServiceStatusRow[], labelWidth: number): string {
  const lines = rows.map((row) => renderServiceStatusRow(row, labelWidth));
  return Str.trimEdgeNewlines(lines.join('\n'));
}

function renderServiceStatusRow(row: ServiceStatusRow, labelWidth: number): string {
  const layout = rowLayout(labelWidth);
  const label = serviceLabel(row, layout.labelWidth);
  const reserve = stripAnsi(label).length + layout.gap.length;
  return `${label}${layout.gap}${serviceValue(row, reserve)}`;
}

function rowLayout(labelWidth: number) {
  const gap = '   ';
  const terminal = Cli.Is.terminal('stdout');
  if (!terminal) return { labelWidth, gap };

  const screenWidth = Cli.Screen.size().width;
  const minValueWidth = 1;
  if (labelWidth + gap.length + minValueWidth <= screenWidth) return { labelWidth, gap };

  const compactLabelWidth = Math.max(0, screenWidth - gap.length - minValueWidth);
  if (compactLabelWidth + gap.length + minValueWidth <= screenWidth) {
    return { labelWidth: compactLabelWidth, gap };
  }

  const compactGap = '';
  return { labelWidth: Math.max(0, screenWidth - minValueWidth), gap: compactGap };
}

function serviceValue(row: ServiceStatusRow, reserve: number): string {
  if (row.kind === 'path') return FmtFit.path(row.value, reserve);
  if (row.kind === 'title') return serviceTitle(row.value, reserve);
  if (row.kind === 'state') return serviceState(row.value as t.Service.State, reserve);
  if (row.kind === 'error') return FmtFit.value(row.value, reserve, { color: c.yellow });
  if (row.kind === 'url' || row.kind === 'url-muted') return serviceUrl(row, reserve);
  return FmtFit.value(row.value, reserve, { color: c.gray });
}

function serviceLabel(row: ServiceStatusRow, width: number): string {
  const text = serviceLabelText(row);
  if (row.labelKind === 'blank') return ' '.repeat(width);

  const color = row.labelKind === 'anchor' ? c.green : fieldLabelColor;
  if (text.length > width) return FmtFit.text(text, width, { color });
  return `${color(text)}${' '.repeat(Math.max(0, width - text.length))}`;
}

function serviceLabelText(row: ServiceStatusRow): string {
  if (row.labelKind === 'blank') return '';
  if (row.labelKind === 'field') return `  ${row.label}`;
  return row.label;
}

function pushServiceUrls(rows: ServiceStatusRow[], urls: readonly t.Service.Url[]) {
  Cli.Fmt.Url.serviceParts(urls).forEach((url, index) => {
    rows.push({
      label: index === 0 ? 'url' : '',
      labelKind: index === 0 ? 'field' : 'blank',
      value: url.display,
      kind: url.highlightOrigin ? 'url' : 'url-muted',
      url,
    });
  });
}

function maxLabelWidth(rows: readonly ServiceStatusRow[]): number {
  return rows.reduce((max, row) => Math.max(max, serviceLabelText(row).length), 0);
}

function serviceUrls(status: t.Service.Status): readonly t.Service.Url[] {
  return status.urls ?? [];
}

function serviceDetails(status: t.Service.Status): readonly t.Service.Detail[] {
  const details = status.details ?? [];
  const hasUrls = (status.urls?.length ?? 0) > 0;

  return details.flatMap((detail): readonly t.Service.Detail[] => {
    if (detail.label === 'connections') return [];
    if (detail.label === 'namespace') return [];
    if (detail.label === 'files.kind') return [];
    if (hasUrls && detail.label === 'path') return [];
    if (hasUrls && detail.label === 'port') return [];
    if (detail.label === 'files.capabilities') {
      return [{ label: 'capabilities', value: formatCapabilities(detail.value) }];
    }
    if (detail.label === 'dist') {
      return [{ label: 'build', value: formatBuildDetail(detail.value) }];
    }
    return [detail];
  });
}

function formatCapabilities(value: string): string {
  return value.split(',').map((part) => part.trim()).filter(Boolean).join(', ');
}

function formatBuildDetail(value: string): string {
  if (value.startsWith('#')) return `dist:${value}`;
  if (value.startsWith('dist:')) return value;
  return value;
}

function pushServiceRoot(rows: ServiceStatusRow[], root: string) {
  const value = serviceRoot(root);
  if (value === './') return;
  rows.push(fieldRow('root', value, 'path'));
}

function serviceRoot(root: string): string {
  const path = Fs.trimCwd(root, { prefix: true });
  return path || './';
}

function serviceTitle(text: string, reserve: number): string {
  const terminal = Cli.Is.terminal('stdout');
  const width = FmtFit.valueWidth(reserve, { terminal });
  if (!terminal || text.length <= width) return serviceTitleFull(text);
  return FmtFit.text(text, width, { color: c.white });
}

function serviceTitleText(service: StartedServiceStatus): string {
  const name = service.service.name;
  const mode = service.selection.variant;
  return mode ? `${name} --mode=${mode}` : name;
}

function serviceTitleFull(text: string): string {
  const marker = ' --mode=';
  const index = text.indexOf(marker);
  if (index < 0) return c.white(text);

  const name = text.slice(0, index);
  const mode = text.slice(index + marker.length);
  return `${c.white(name)} ${c.dim(c.cyan(`--mode=${mode}`))}`;
}

function serviceDivider(): string {
  return c.dim(c.gray(Cli.Fmt.hr({ weight: 'dashed' })));
}

function serviceState(state: t.Service.State, reserve: number): string {
  const color = state === 'error' ? c.yellow : state === 'stopped' ? c.gray : c.white;
  return FmtFit.value(state, reserve, { color });
}

function serviceUrl(row: ServiceStatusRow, reserve: number): string {
  const url = row.url;
  const terminal = Cli.Is.terminal('stdout');
  const width = FmtFit.valueWidth(reserve, { terminal });
  const highlightOrigin = row.kind === 'url';
  if (!url) return FmtFit.value(row.value, reserve, { color: highlightOrigin ? c.cyan : c.gray });
  if (!terminal || url.display.length <= width) {
    return Cli.Fmt.Url.service(url, { highlightOrigin: url.highlightOrigin });
  }
  return FmtFit.text(url.display, width, { color: highlightOrigin ? c.cyan : c.gray });
}

function fieldLabelColor(text: string): string {
  return c.dim(c.gray(text));
}

function anchorRow(label: string, value: string): ServiceStatusRow {
  return { label, labelKind: 'anchor', value, kind: 'title' };
}

function fieldRow(label: string, value: string, kind: ServiceStatusKind): ServiceStatusRow {
  return { label, labelKind: label ? 'field' : 'blank', value, kind };
}

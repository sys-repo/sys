import type { StartedServiceStatus } from '../../m.cell/u.services/u.status.ts';
import { c, Cli, Fs, Is, Num, Str, stripAnsi, type t, Url } from '../common.ts';
import { FmtFit } from './u.fit.ts';

type ServicesStartedOptions = {
  readonly services: readonly StartedServiceStatus[];
  readonly width?: number;
  readonly hyperlinks?: boolean;
};

type ServiceStatusKind = 'title' | 'subtle' | 'path' | 'state' | 'error' | 'url';
type ServiceLabelKind = 'anchor' | 'field' | 'blank';

type ServiceStatusRow = {
  readonly label: string;
  readonly labelKind: ServiceLabelKind;
  readonly value: string;
  readonly kind: ServiceStatusKind;
  readonly url?: t.Cli.Fmt.ServiceUrl.Part;
};

type ServiceUrlAdmission =
  | { readonly kind: 'link'; readonly target: URL }
  | { readonly kind: 'plain' }
  | { readonly kind: 'invalid' };

type ServiceRenderContext = {
  readonly labelWidth: number;
  readonly gap: string;
  readonly width: number | undefined;
  readonly hyperlinks: boolean;
};

export const FmtServices = Object.freeze(
  {
    started(options: ServicesStartedOptions): string {
      const width = normalizeWidth(options.width);
      if (options.services.length === 0 || width === 0) return '';

      const sections = options.services.map(serviceStatusRows);
      const layout = rowLayout(maxLabelWidth(sections.flat()), width);
      const context: ServiceRenderContext = {
        ...layout,
        width,
        hyperlinks: options.hyperlinks === true,
      };
      const separator = `\n${serviceDivider(width)}\n`;
      const body = sections.map((rows) => renderServiceStatus(rows, context)).join(separator);

      return `\n${body}\n`;
    },
  } as const,
);

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

function renderServiceStatus(
  rows: readonly ServiceStatusRow[],
  context: ServiceRenderContext,
): string {
  const lines = rows.map((row) => renderServiceStatusRow(row, context));
  return Str.trimEdgeNewlines(lines.join('\n'));
}

function renderServiceStatusRow(
  row: ServiceStatusRow,
  context: ServiceRenderContext,
): string {
  const label = serviceLabel(row, context.labelWidth);
  const reserve = stripAnsi(label).length + context.gap.length;
  const value = serviceValue(row, reserve, context);
  return `${label}${context.gap}${value}`;
}

function rowLayout(labelWidth: number, width?: number) {
  const gap = '   ';
  const fit = shouldFit(width);
  if (!fit) return { labelWidth, gap };

  const screenWidth = width ?? Cli.Screen.size().width;
  const minValueWidth = 1;
  if (labelWidth + gap.length + minValueWidth <= screenWidth) return { labelWidth, gap };

  const compactLabelWidth = Math.max(0, screenWidth - gap.length - minValueWidth);
  if (compactLabelWidth + gap.length + minValueWidth <= screenWidth) {
    return { labelWidth: compactLabelWidth, gap };
  }

  const compactGap = '';
  return { labelWidth: Math.max(0, screenWidth - minValueWidth), gap: compactGap };
}

function serviceValue(
  row: ServiceStatusRow,
  reserve: number,
  context: ServiceRenderContext,
): string {
  const { hyperlinks, width } = context;
  const fit = { width, terminal: shouldFit(width) };
  if (row.kind === 'path') return FmtFit.path(row.value, reserve, fit);
  if (row.kind === 'title') return serviceTitle(row.value, reserve, width);
  if (row.kind === 'state') return serviceState(row.value as t.Service.State, reserve, width);
  if (row.kind === 'error') return FmtFit.value(row.value, reserve, { ...fit, color: c.yellow });
  if (row.kind === 'url') return serviceUrl(row.url, reserve, width, hyperlinks);
  return FmtFit.value(row.value, reserve, { ...fit, color: c.gray });
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
  if (row.labelKind === 'field') return ` ${row.label}`;
  return row.label;
}

function pushServiceUrls(rows: ServiceStatusRow[], urls: readonly t.Service.Url[]) {
  Cli.Fmt.ServiceUrl.parts(urls).forEach((url, index) => {
    rows.push({
      label: index === 0 ? 'url' : '',
      labelKind: index === 0 ? 'field' : 'blank',
      value: url.display,
      kind: 'url',
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

function serviceTitle(text: string, reserve: number, renderWidth?: number): string {
  const fit = shouldFit(renderWidth);
  const width = FmtFit.valueWidth(reserve, { terminal: fit, width: renderWidth });
  if (!fit || Cli.Fmt.Text.Width.measure(text) <= width) return serviceTitleFull(text);
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

function serviceDivider(width?: number): string {
  return c.dim(c.gray(Cli.Fmt.hr({ width, weight: 'dashed' })));
}

function serviceState(state: t.Service.State, reserve: number, width?: number): string {
  const color = state === 'error' ? c.yellow : state === 'stopped' ? c.gray : c.white;
  return FmtFit.value(state, reserve, { color, terminal: shouldFit(width), width });
}

function serviceUrl(
  url: t.Cli.Fmt.ServiceUrl.Part | undefined,
  reserve: number,
  renderWidth: number | undefined,
  hyperlinks: boolean,
): string {
  const fit = shouldFit(renderWidth);
  const width = FmtFit.valueWidth(reserve, { terminal: fit, width: renderWidth });
  if (!url) return invalidServiceUrl(reserve, renderWidth, fit);

  const admission = admitServiceUrl(url);
  if (admission.kind === 'invalid') return invalidServiceUrl(reserve, renderWidth, fit);

  const label = fit ? clipServiceUrl(url, width) : Cli.Fmt.ServiceUrl.format(url);
  if (!hyperlinks || admission.kind !== 'link' || !isLinkLabel(label)) return label;
  return Cli.Fmt.hyperlink(label, admission.target);
}

function invalidServiceUrl(
  reserve: number,
  renderWidth: number | undefined,
  fit: boolean,
): string {
  return FmtFit.value('invalid URL', reserve, {
    color: c.yellow,
    terminal: fit,
    width: renderWidth,
  });
}

function clipServiceUrl(part: t.Cli.Fmt.ServiceUrl.Part, width: number): string {
  if (width <= 0) return '';
  if (Cli.Fmt.Text.Width.measure(part.display) <= width) return Cli.Fmt.ServiceUrl.format(part);

  return Cli.Fmt.Text.ellipsize(part.display, width, {
    render: ({ head, ellipsis, tail }) => {
      const tailStart = part.display.length - tail.length;
      return `${formatServiceUrlFragment(part, head, 0)}${Cli.Fmt.omission(ellipsis)}${
        formatServiceUrlFragment(part, tail, tailStart)
      }`;
    },
  });
}

function formatServiceUrlFragment(
  part: t.Cli.Fmt.ServiceUrl.Part,
  text: string,
  offset: number,
): string {
  const originEnd = part.origin.length;
  const portStart = part.port ? originEnd - part.port.length : originEnd;
  const origin = part.highlightOrigin ? c.cyan : c.gray;
  const port = part.highlightOrigin ? (value: string) => c.bold(c.cyan(value)) : c.gray;
  const suffix = part.highlightOrigin && part.suffix === '/' ? c.cyan : c.gray;

  return [
    formatServiceUrlRange(text, offset, 0, portStart, origin),
    formatServiceUrlRange(text, offset, portStart, originEnd, port),
    formatServiceUrlRange(text, offset, originEnd, part.display.length, suffix),
  ].join('');
}

function formatServiceUrlRange(
  text: string,
  offset: number,
  start: number,
  end: number,
  color: (value: string) => string,
): string {
  const from = Math.max(offset, start);
  const to = Math.min(offset + text.length, end);
  return from >= to ? '' : color(text.slice(from - offset, to - offset));
}

function admitServiceUrl(part: t.Cli.Fmt.ServiceUrl.Part): ServiceUrlAdmission {
  if (!part.ok || hasTerminalControl(part.href)) return { kind: 'invalid' };

  const parsed = Url.parse(part.href);
  if (!parsed.ok) return { kind: 'invalid' };
  const target = parsed.toURL();
  if (target.username || target.password) return { kind: 'invalid' };
  return isServiceLinkProtocol(target.protocol) ? { kind: 'link', target } : { kind: 'plain' };
}

function hasTerminalControl(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) return true;
  }
  return false;
}

function isServiceLinkProtocol(protocol: string): boolean {
  return protocol === 'http:' ||
    protocol === 'https:' ||
    protocol === 'ws:' ||
    protocol === 'wss:';
}

function isLinkLabel(label: string): boolean {
  const text = stripAnsi(label);
  return text.length > 0 && text !== '…';
}

function normalizeWidth(width?: number): number | undefined {
  if (width === undefined) return undefined;
  if (!Num.Is.finite(width) || width <= 0) return 0;
  return Math.floor(width);
}

function shouldFit(width?: number): boolean {
  return width !== undefined || Cli.Is.terminal('stdout');
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

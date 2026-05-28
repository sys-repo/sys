import type { StartedServiceStatus } from '../../m.cell/u.services/u.status.ts';
import { c, Cli, Fs, Is, Str, stripAnsi, type t } from '../common.ts';

type ServicesStartedResult = {
  services: readonly StartedServiceStatus[];
};

type ServiceStatusRow = readonly [label: string, value: string];

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

  rows.push([serviceRootLabel('service'), serviceTitle(service)]);
  rows.push([serviceLabel('module'), serviceSubtle(service.service.from)]);

  if (owner) {
    if (owner.state !== 'ready') rows.push([serviceLabel('state'), serviceState(owner.state)]);
    if (Is.str(owner.root)) pushServiceRoot(rows, owner.root);
    for (const detail of serviceDetails(owner)) {
      rows.push([serviceLabel(detail.label), serviceSubtle(detail.value)]);
    }
    if (Is.stdError(owner.error)) rows.push([serviceLabel('error'), serviceError(owner.error)]);
    pushServiceUrls(rows, serviceUrls(owner));
  }

  return rows;
}

function renderServiceStatus(rows: readonly ServiceStatusRow[], labelWidth: number): string {
  const lines = rows.map(([label, value]) => `${padLabel(label, labelWidth)}   ${value}`);
  return Str.trimEdgeNewlines(lines.join('\n'));
}

function pushServiceUrls(rows: ServiceStatusRow[], urls: readonly t.Service.Url[]) {
  Cli.Fmt.Url.serviceList(urls).forEach((url, index) => {
    rows.push([index === 0 ? serviceLabel('url') : '', url]);
  });
}

function maxLabelWidth(rows: readonly ServiceStatusRow[]): number {
  return rows.reduce((max, [label]) => Math.max(max, stripAnsi(label).length), 0);
}

function padLabel(label: string, width: number): string {
  const pad = Math.max(0, width - stripAnsi(label).length);
  return `${label}${' '.repeat(pad)}`;
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
    return [detail];
  });
}

function formatCapabilities(value: string): string {
  return value.split(',').map((part) => part.trim()).filter(Boolean).join(', ');
}

function pushServiceRoot(rows: ServiceStatusRow[], root: string) {
  const value = serviceRoot(root);
  if (stripAnsi(value) === './') return;
  rows.push([serviceLabel('root'), value]);
}

function serviceRoot(root: string): string {
  const path = Fs.trimCwd(root, { prefix: true });
  return c.gray(path || './');
}

function serviceRootLabel(label: string): string {
  return c.gray(label);
}

function serviceLabel(label: string): string {
  return c.dim(c.gray(`  ${label}`));
}

function serviceSubtle(text: string): string {
  return c.gray(text);
}

function serviceTitle(service: StartedServiceStatus): string {
  const name = c.white(service.service.name);
  const mode = service.selection.variant;
  return mode ? `${name} ${c.dim(c.cyan(`--mode=${mode}`))}` : name;
}

function serviceDivider(): string {
  return c.dim(c.gray(Cli.Fmt.hr({ weight: 'dashed' })));
}

function serviceState(state: t.Service.State): string {
  if (state === 'error') return c.yellow(state);
  if (state === 'stopped') return c.gray(state);
  return c.white(state);
}

function serviceError(error: t.StdError): string {
  return c.yellow(`${error.name}: ${error.message}`);
}

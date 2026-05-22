import type { StartedServiceStatus } from '../m.cell/u.services/u.status.ts';
import { c, Cli, CliTable, Is, Str, type t } from './common.ts';
import { FmtPath } from './u.fmt.path.ts';

type ServicesStartedResult = {
  services: readonly StartedServiceStatus[];
};

export const FmtServices = {
  started(res: ServicesStartedResult): string {
    const blocks = res.services.map(renderServiceStatus);
    if (blocks.length === 0) return '';
    const text = blocks.join(`\n${serviceDivider()}\n`);
    return `\n${Str.trimEdgeNewlines(text)}\n`;
  },
} as const;

/**
 * Helpers:
 */
function renderServiceStatus(service: StartedServiceStatus): string {
  const table = CliTable.create([]);
  const owner = service.owner;

  table.push([serviceLabel('service'), c.white(service.service.name)]);
  if (service.selection.variant) {
    table.push([serviceLabel('mode'), serviceMode(service.selection.variant)]);
  }
  table.push([serviceLabel('module'), serviceSubtle(service.service.from)]);
  table.push([serviceLabel('config'), FmtPath.display(service.paths.config)]);

  if (owner) {
    if (owner.state !== 'ready') table.push([serviceLabel('state'), serviceState(owner.state)]);
    if (Is.str(owner.root)) table.push([serviceLabel('root'), serviceRoot(owner.root)]);
    for (const detail of serviceDetails(owner)) {
      table.push([serviceLabel(detail.label), serviceSubtle(detail.value)]);
    }
    if (Is.stdError(owner.error)) table.push([serviceLabel('error'), serviceError(owner.error)]);
    pushServiceUrls(table, serviceUrls(owner));
  }

  return Str.trimEdgeNewlines(String(table));
}

function pushServiceUrls(
  table: ReturnType<typeof CliTable.create>,
  urls: readonly t.Service.Url[],
) {
  const ordered = Cli.Fmt.Url.orderBaseLast(urls);
  ordered.forEach((url, index) => {
    const highlightOrigin = index === ordered.length - 1;
    table.push([
      index === 0 ? serviceLabel('url') : '',
      Cli.Fmt.Url.service(url, { highlightOrigin }),
    ]);
  });
}

function serviceUrls(status: t.Service.Status): readonly t.Service.Url[] {
  return status.urls ?? [];
}

function serviceDetails(status: t.Service.Status): readonly t.Service.Detail[] {
  const details = status.details ?? [];
  if ((status.urls?.length ?? 0) === 0) return details;
  return details.filter((detail) => detail.label !== 'port');
}

function serviceRoot(root: string): string {
  return FmtPath.display(root);
}

function serviceLabel(label: string): string {
  return c.gray(label);
}

function serviceSubtle(text: string): string {
  return c.gray(text);
}

function serviceMode(mode: string): string {
  return c.magenta(mode);
}

function serviceDivider(): string {
  return c.dim(c.gray(Cli.Fmt.hr()));
}

function serviceState(state: t.Service.State): string {
  if (state === 'error') return c.yellow(state);
  if (state === 'stopped') return c.gray(state);
  return c.white(state);
}

function serviceError(error: t.StdError): string {
  return c.yellow(`${error.name}: ${error.message}`);
}

import type { StartedServiceStatus } from '../m.cell/u.services/u.status.ts';
import { c, Cli, CliTable, Fs, Is, Str, type t } from './common.ts';

type ServicesStartedResult = {
  services: readonly StartedServiceStatus[];
};

export const FmtServices = {
  started(res: ServicesStartedResult): string {
    const text = res.services.map(renderServiceStatus).join('\n\n');
    return Str.trimEdgeNewlines(text);
  },
} as const;

/**
 * Helpers:
 */
function renderServiceStatus(service: StartedServiceStatus): string {
  const table = CliTable.create([]);
  const owner = service.owner;

  table.push([serviceLabel('service'), c.white(service.service.name)]);
  table.push([serviceLabel('module'), serviceSubtle(service.service.from)]);
  table.push([serviceLabel('config'), servicePath(service.paths.config)]);

  if (owner) {
    if (owner.state !== 'ready') table.push([serviceLabel('state'), serviceState(owner.state)]);
    if (Is.str(owner.root)) table.push([serviceLabel('root'), servicePath(owner.root)]);
    pushServiceUrls(table, serviceUrls(owner));
    for (const detail of serviceDetails(owner)) {
      table.push([serviceLabel(detail.label), serviceSubtle(detail.value)]);
    }
    if (Is.stdError(owner.error)) table.push([serviceLabel('error'), serviceError(owner.error)]);
  }

  return Str.trimEdgeNewlines(String(table));
}

function pushServiceUrls(
  table: ReturnType<typeof CliTable.create>,
  urls: readonly t.Service.Url[],
) {
  urls.forEach((url, index) => {
    table.push([index === 0 ? serviceLabel('url') : '', serviceUrl(url)]);
  });
}

function serviceUrls(status: t.Service.Status): readonly t.Service.Url[] {
  return status.urls ?? [];
}

function serviceDetails(status: t.Service.Status): readonly t.Service.Detail[] {
  return status.details ?? [];
}

function serviceLabel(label: string): string {
  return c.gray(label);
}

function servicePath(path: string): string {
  return c.gray(Cli.Fmt.path(Fs.trimCwd(path), Cli.Fmt.Path.fmt()));
}

function serviceSubtle(text: string): string {
  return c.gray(text);
}

function serviceUrl(url: t.Service.Url): string {
  const href = c.cyan(url.href);
  return url.label ? `${href} ${serviceSubtle(url.label)}` : href;
}

function serviceState(state: t.Service.State): string {
  if (state === 'error') return c.yellow(state);
  if (state === 'stopped') return c.gray(state);
  return c.white(state);
}

function serviceError(error: t.StdError): string {
  return c.yellow(`${error.name}: ${error.message}`);
}

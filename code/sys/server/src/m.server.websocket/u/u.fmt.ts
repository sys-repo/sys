import { c, Cli, type CliTable, Fs, Is, Str, type t } from '../common.ts';
import { serviceOpenUrl } from './u.status.ts';

/** Print the renderer-owned startup summary for a directly-started WebSocket service. */
export function printStarted(
  server: t.WebSocketServer.Started,
  options: StartFormatOptions,
) {
  const text = formatStarted(server.status(), options);
  if (text) console.info(`\n${text}\n`);
}

/** Render a service status snapshot for direct WebSocket server startup. */
export function formatStarted(status: t.Service.Status, options: StartFormatOptions): string {
  const table = Cli.table([]);

  table.push([label('service'), serviceName(status)]);
  pushUrls(table, status.urls ?? []);
  if (status.state !== 'ready') table.push([childLabel('state'), value(status.state)]);
  if (Is.str(status.config)) table.push([childLabel('config'), path(status.config)]);
  if (Is.str(status.root)) table.push([childLabel('root'), path(status.root)]);
  for (const detail of serviceDetails(status)) {
    table.push([childLabel(detail.label), value(detail.value)]);
  }
  if (Is.stdError(status.error)) table.push([childLabel('error'), serviceError(status.error)]);
  const open = openKey(status, options);
  if (open) table.push([quitLabel('open'), quitValue(open)]);
  const quit = quitKeys(options);
  if (quit) table.push([quitLabel('quit'), quitValue(quit)]);

  return Str.trimEdgeNewlines(String(table));
}

type StartFormatOptions = {
  readonly lifecycle: t.WebSocketServer.Lifecycle;
  readonly keyboard: boolean;
};

/**
 * Helpers:
 */
function pushUrls(table: CliTable, urls: readonly t.Service.Url[]) {
  Cli.Fmt.Url.serviceList(urls).forEach((url, index) => {
    table.push([index === 0 ? childLabel('url') : '', url]);
  });
}

function serviceName(status: t.Service.Status): string {
  if (Is.str(status.name) && status.name.length > 0) return c.white(status.name);
  if (Is.str(status.kind) && status.kind.length > 0) return c.white(status.kind);
  return c.white('websocket');
}

function serviceDetails(status: t.Service.Status): readonly t.Service.Detail[] {
  return (status.details ?? []).filter((detail) => detail.label !== 'connections');
}

function label(value: string): string {
  return c.gray(value);
}

function childLabel(value: string): string {
  return label(`  ${value}`);
}

function value(input: string): string {
  return c.gray(input);
}

function path(input: string): string {
  return value(Fs.trimCwd(input));
}

function openKey(status: t.Service.Status, options: StartFormatOptions): string | undefined {
  if (!options.keyboard) return undefined;
  return serviceOpenUrl(status) ? 'O' : undefined;
}

function quitKeys(options: StartFormatOptions): string | undefined {
  const keys: string[] = [];
  if (options.lifecycle === 'process' || options.keyboard) keys.push('Ctrl+C');
  if (options.keyboard) keys.push('Q');
  return keys.length > 0 ? keys.join(' or ') : undefined;
}

function quitLabel(input: string): string {
  return c.dim(c.gray(`  ${input}`));
}

function quitValue(input: string): string {
  return c.dim(c.gray(input));
}

function serviceError(error: t.StdError): string {
  return value(`${error.name}: ${error.message}`);
}

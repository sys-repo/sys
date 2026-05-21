import { c, Cli, Fs, Is, Str, type t } from '../common.ts';

/** Print the renderer-owned startup summary for a directly-started WebSocket service. */
export function printStarted(
  server: t.WebSocketServer.Started,
  options: { readonly lifecycle: t.WebSocketServer.Lifecycle },
) {
  const text = formatStarted(server.status(), options);
  if (text) console.info(`\n${text}\n`);
}

/** Render a service status snapshot for direct WebSocket server startup. */
export function formatStarted(
  status: t.Service.Status,
  options: { readonly lifecycle: t.WebSocketServer.Lifecycle },
): string {
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
  if (options.lifecycle === 'process') table.push([quitLabel('quit'), quitValue('Ctrl+C')]);

  return Str.trimEdgeNewlines(String(table));
}

/**
 * Helpers:
 */
function pushUrls(table: ReturnType<typeof Cli.table>, urls: readonly t.Service.Url[]) {
  const ordered = Cli.Fmt.Url.orderBaseLast(urls);
  ordered.forEach((url, index) => {
    const highlightOrigin = index === ordered.length - 1;
    table.push([
      index === 0 ? childLabel('url') : '',
      Cli.Fmt.Url.service(url, { highlightOrigin }),
    ]);
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

function quitLabel(input: string): string {
  return c.dim(c.gray(`  ${input}`));
}

function quitValue(input: string): string {
  return c.dim(c.gray(input));
}

function serviceError(error: t.StdError): string {
  return value(`${error.name}: ${error.message}`);
}

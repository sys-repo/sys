import { D, Http, Str, type t } from '../common.ts';
import { resolveServeHost, resolveServePort } from '../u.startOptions.ts';
import { discoverOpenTargets } from './u.openTargets.discover.ts';
import { route } from './u.serve.route.ts';

/** Start a local HTTP server for the given directory and return the running context. */
export async function startServer(
  location: t.ServeTool.LocationYaml.Location,
  opts: t.ServeTool.StartServerOpts = {},
): Promise<t.ServeTool.StartServingContext> {
  const { dir, name } = location;
  const app = Http.Server.create({ static: false });

  app.use('*', Http.Server.forceDirSlash(dir));
  app.use('*', route({ dir }));
  app.use('*', Http.Server.static({ root: dir }));

  const host = resolveServeHost(opts.host, 'startServer');
  const hostname = host === 'network' ? '0.0.0.0' : '127.0.0.1';
  const info = await resolveInfo(location);
  const infoPath = firstPathInfo(info);
  const started = Http.Server.start(app, {
    port: resolveServePort(opts.port, 'startServer') ?? D.port,
    hostname,
    name,
    info,
    dir,
    silent: opts.silent === true,
    keyboard: opts.keyboard,
    until: opts.until,
  });
  const port = started.port;
  const server = started.server;
  const baseUrl = host === 'network' ? `http://0.0.0.0:${port}` : `${started.origin}`;
  const url = infoPath ? `${baseUrl}/${Str.trimLeadingSlashes(infoPath)}` : `${baseUrl}/`;

  return {
    location,
    host,
    hostname,
    port,
    baseUrl: baseUrl as t.StringUrl,
    url: url as t.StringUrl,
    server,
    async close(reason) {
      await started.close(reason ?? 'serve.close');
    },
  };
}

/**
 * Helpers:
 */
async function resolveInfo(location: t.ServeTool.LocationYaml.Location) {
  const explicit = normalizeInfo(location.info);
  if (explicit) return explicit;

  const targets = await discoverOpenTargets(location.dir);
  const paths = targets.map((target) => target.path).filter(Boolean);
  if (paths.length !== 1) return undefined;

  return { path: `/${Str.trimSlashes(paths[0])}/` };
}

function normalizeInfo(info?: Record<string, string>) {
  if (!info) return undefined;
  return Object.fromEntries(
    Object.entries(info).map(([key, value]) => {
      const trimmed = value.trim();
      const normalized = trimmed.startsWith('/') ? `/${Str.trimLeadingSlashes(trimmed)}` : trimmed;
      return [key, normalized];
    }),
  );
}

function firstPathInfo(info?: Record<string, string>) {
  return Object.values(info ?? {}).find((value) => value.startsWith('/'));
}

import { Fs, HttpServer, Path, type t } from './common.ts';
import { loadConfig } from './u.config.doc.ts';

type F = t.HttpStatic.Lib['start'];

/**
 * Start a static HTTP server lifecycle.
 */
export const start: F = async (input = {}) => {
  const args = await wrangle.args(input);
  const root = wrangle.root(args);
  const app = HttpServer.create({ static: false });

  app.use('*', HttpServer.forceDirSlash(root));
  app.use('*', HttpServer.static({ root }));

  return HttpServer.start(app, {
    hostname: args.hostname as t.StringHostname | undefined,
    port: args.port as t.PortNumber | undefined,
    name: args.name,
    info: args.info,
    dir: root,
    status: {
      kind: 'static',
      root,
      config: wrangle.configPathOrUndefined(args),
      urlPaths: wrangle.urlPaths(args.info),
      details: wrangle.details(args.info),
    },
    silent: args.silent,
    keyboard: args.keyboard,
    until: args.until,
  });
};

/**
 * Helpers:
 */
const wrangle = {
  async args(args: t.HttpStatic.StartArgs): Promise<t.HttpStatic.StartArgs> {
    const config = args.paths?.config;
    if (!config) return args;

    const doc = await loadConfig(wrangle.configPath(args), 'HttpStatic.start');
    return { ...doc, ...args };
  },

  configPath(args: t.HttpStatic.StartArgs): t.StringPath {
    const path = args.paths?.config;
    if (!path) throw new Error('HttpStatic.start: missing config path.');
    if (Path.Is.absolute(path)) return Path.normalize(path) as t.StringPath;
    const cwd = args.cwd ? Fs.resolve(args.cwd) : Fs.cwd('process');
    return Path.resolve(cwd, path) as t.StringPath;
  },

  configPathOrUndefined(args: t.HttpStatic.StartArgs): t.StringPath | undefined {
    return args.paths?.config ? wrangle.configPath(args) : undefined;
  },

  urlPaths(info: Record<string, string> | undefined): readonly t.HttpServer.Status.UrlPath[] {
    const paths = Object.entries(info ?? {})
      .filter(([, value]) => wrangle.isPathInfo(value))
      .map(([label, path]) => ({ label, path: path.trim() as t.StringUrlRoute }));
    return paths.length > 0 ? paths : ['/'] as const;
  },

  details(info: Record<string, string> | undefined): readonly t.Service.Detail[] {
    return Object.entries(info ?? {})
      .filter(([, value]) => !wrangle.isPathInfo(value))
      .map(([label, value]) => ({ label, value: value.trim() }));
  },

  isPathInfo(value: string) {
    return value.trim().startsWith('/');
  },

  root(args: t.HttpStatic.StartArgs): t.StringDir {
    const cwd = args.cwd ? Fs.resolve(args.cwd) : Fs.cwd('process');
    const dir = args.dir ?? '.';
    const root = Path.Is.absolute(dir) ? Path.normalize(dir) : Path.resolve(cwd, dir);
    return root as t.StringDir;
  },
} as const;

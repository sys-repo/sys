import { Fs, HttpServer, Path, type t } from './common.ts';

type F = t.HttpStatic.Lib['start'];

/**
 * Start a static HTTP server lifecycle.
 */
export const start: F = async (args = {}) => {
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
    silent: args.silent,
    keyboard: args.keyboard,
    until: args.until,
  });
};

/**
 * Helpers:
 */
const wrangle = {
  root(args: t.HttpStatic.StartArgs): t.StringDir {
    const cwd = args.cwd ? Fs.resolve(args.cwd) : Fs.cwd('process');
    const dir = args.dir ?? '.';
    const root = Path.Is.absolute(dir) ? Path.normalize(dir) : Path.resolve(cwd, dir);
    return root as t.StringDir;
  },
} as const;

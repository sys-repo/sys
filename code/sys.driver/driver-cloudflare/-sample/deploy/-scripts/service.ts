import { HttpServer } from '@sys/http/server';
import { appFrom, readInputs } from '../src/m.deployment/mod.ts';
import { Env, Fs, pkg, type t } from './common.ts';
import { buildStatus } from './u.status.ts';

const DEFAULT_DEPS: t.SampleServiceDependencies = {
  readInputs,
  loadEnv: (cwd) => Env.load({ cwd, search: 'upward' }),
  appFrom,
  start: HttpServer.start,
};

/**
 * Start the sample after private-manifest admission; the caller owns the returned HTTP lifecycle.
 */
export const SampleService: t.SampleService = {
  start: (args) => startWith(args, DEFAULT_DEPS),
};

/** Internal bootstrap seam; shell facts and presentation always come from the real local build. */
export async function startWith(
  args: t.SampleServiceArgs,
  deps: t.SampleServiceDependencies,
): Promise<t.HttpServer.Started> {
  const root = Fs.resolve(args.cwd);
  if (Fs.resolve(root, args.paths.config) !== Fs.join(root, 'r2.config.json')) {
    throw new Error('Sample service requires the root r2.config.json.');
  }
  const inputs = await deps.readInputs(root);
  const env = await deps.loadEnv(root);
  const app = await deps.appFrom(inputs, env);
  const build = await buildStatus(inputs.buildRecord.selection.pins.private, root);
  return deps.start(app, {
    until: args.until,
    silent: args.silent,
    name: pkg.name,
    hostname: '127.0.0.1',
    port: 8080,
    strictPort: true,
    keyboard: false,
    formatDetail: build.formatDetail,
    status: {
      details: [build.detail],
      urlPaths: ['/', '/ui/', '/ui/dist.json', '/api/hello'],
    },
  });
}

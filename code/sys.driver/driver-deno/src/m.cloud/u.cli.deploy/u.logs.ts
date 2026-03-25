import { type t, D, Fs, Is } from './common.ts';
import { hasValue } from './u.ts';

type DeployLogsCli = {
  readonly cmd: string;
  readonly cwd: t.StringDir;
  readonly args: readonly string[];
};

type PreparedDeployLogsCli = {
  readonly cli: DeployLogsCli;
  readonly root: t.StringDir;
  readonly config: t.StringPath;
};

/**
 * The owned native Deno Deploy logs CLI boundary for `driver-deno`.
 *
 * Keep logs CLI invocation isolated here so package-root config is never
 * touched by ambient CLI behavior.
 */
export async function logs(req: { app: string; org?: string; token?: string; start?: string }) {
  const app = req.app.trim();
  if (app.length === 0) throw new Error('DenoDeploy.logs: app must be a non-empty string');

  const root = (await Fs.makeTempDir({ prefix: D.tmpDirPrefix.logs })).absolute;
  const config = Fs.join(root, 'deno.json');
  await Fs.writeJson(config, {});

  const args = ['deploy', 'logs', '--app', app];
  if (Is.str(req.org) && hasValue(req.org)) args.push('--org', req.org.trim());
  if (Is.str(req.token) && hasValue(req.token)) args.push('--token', req.token.trim());
  if (Is.str(req.start) && hasValue(req.start)) args.push('--start', req.start.trim());
  args.push('--config', config);

  return {
    cli: { cmd: D.cmd.deno, cwd: root, args },
    root,
    config,
  } as const satisfies PreparedDeployLogsCli;
}

import { type t, D, Fs, Is } from './common.ts';

type DeployCli = {
  readonly cmd: string;
  readonly cwd: t.StringDir;
  readonly args: readonly string[];
};

/**
 * The only native Deno Deploy CLI boundary for `driver-deno`.
 *
 * Keep deploy CLI invocation isolated here so `cwd` and `--config` remain
 * explicit and package-root config is never touched by ambient CLI behavior.
 */
export function toDeployCli(req: t.DenoDeploy.Deploy.Request): DeployCli {
  const app = req.app.trim();
  if (app.length === 0) throw new Error('DenoDeploy.deploy: app must be a non-empty string');
  const config =
    Is.str(req.config) && req.config.trim().length > 0
      ? req.config.trim()
      : Fs.join(req.stage.root, 'deno.json');

  const args = ['deploy', '--app', app];
  if (Is.str(req.org) && req.org.trim().length > 0) args.push('--org', req.org.trim());
  if (Is.str(req.token) && req.token.trim().length > 0) args.push('--token', req.token.trim());
  args.push('--config', config);
  if (req.prod === true) args.push('--prod');
  if (req.allowNodeModules === true) args.push('--allow-node-modules');
  if (req.noWait === true) args.push('--no-wait');
  args.push(req.stage.root);

  return {
    cmd: D.cmd.deno,
    cwd: req.stage.root,
    args,
  };
}

import { type t, Fs, Is } from './common.ts';

export function toDeployArgs(req: t.DenoDeploy.Deploy.Request): string[] {
  const app = req.app.trim();
  if (app.length === 0) throw new Error('DenoDeploy.deploy: app must be a non-empty string');
  const config = Is.str(req.config) && req.config.trim().length > 0 ? req.config.trim() : Fs.join(req.stage.root, 'deno.json');

  const args = ['deploy', '--app', app];
  if (Is.str(req.org) && req.org.trim().length > 0) args.push('--org', req.org.trim());
  if (Is.str(req.token) && req.token.trim().length > 0) args.push('--token', req.token.trim());
  args.push('--config', config);
  if (req.prod === true) args.push('--prod');
  if (req.allowNodeModules === true) args.push('--allow-node-modules');
  if (req.noWait === true) args.push('--no-wait');
  args.push(req.stage.root);
  return args;
}

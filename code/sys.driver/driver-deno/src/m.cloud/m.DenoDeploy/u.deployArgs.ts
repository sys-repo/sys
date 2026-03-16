import { type t, Is } from './common.ts';

export function toDeployArgs(request: t.DenoDeploy.Deploy.Request): string[] {
  const app = request.app.trim();
  if (app.length === 0) throw new Error('DenoDeploy.deploy: app must be a non-empty string');

  const args = ['deploy', '--app', app];
  if (Is.str(request.org) && request.org.trim().length > 0) args.push('--org', request.org.trim());
  if (Is.str(request.token) && request.token.trim().length > 0) args.push('--token', request.token.trim());
  if (Is.str(request.config) && request.config.trim().length > 0) args.push('--config', request.config.trim());
  if (request.prod === true) args.push('--prod');
  if (request.allowNodeModules === true) args.push('--allow-node-modules');
  if (request.noWait === true) args.push('--no-wait');
  args.push(request.stage.root);
  return args;
}

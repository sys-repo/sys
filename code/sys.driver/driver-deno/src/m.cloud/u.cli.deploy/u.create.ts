import { type t, D, Path, Is } from './common.ts';
import { hasValue } from './u.ts';

/**
 * The owned native Deno Deploy create CLI boundary for `driver-deno`.
 *
 * Keep app creation invocation isolated here so request normalization and
 * ambient CLI behavior stay outside higher-level orchestration.
 */
export function create(req: t.DenoApp.Create.Request) {
  const app = req.app.trim();
  if (app.length === 0) throw new Error('DenoApp.create: app must be a non-empty string');
  const root = Is.str(req.root) && hasValue(req.root) ? Path.resolve(req.root.trim()) : Deno.cwd();

  const args = ['deploy', 'create', '--source', 'local', '--app', app];
  if (Is.str(req.org) && hasValue(req.org)) args.push('--org', req.org.trim());
  if (Is.str(req.token) && hasValue(req.token)) args.push('--token', req.token.trim());
  if (Is.str(req.config) && hasValue(req.config)) args.push('--config', req.config.trim());
  if (Is.str(req.region) && hasValue(req.region)) args.push('--region', req.region.trim());
  if (req.noWait !== false) args.push('--no-wait');
  if (req.dryRun === true) args.push('--dry-run');
  if (req.doNotUseDetectedBuildConfig === true) args.push('--do-not-use-detected-build-config');
  if (Is.str(req.appDirectory) && hasValue(req.appDirectory)) args.push('--app-directory', req.appDirectory.trim());
  if (Is.str(req.installCommand) && hasValue(req.installCommand)) args.push('--install-command', req.installCommand.trim());
  if (Is.str(req.buildCommand) && hasValue(req.buildCommand)) args.push('--build-command', req.buildCommand.trim());
  if (Is.str(req.preDeployCommand) && hasValue(req.preDeployCommand)) {
    args.push('--pre-deploy-command', req.preDeployCommand.trim());
  }
  if (Is.str(req.runtimeMode) && hasValue(req.runtimeMode)) args.push('--runtime-mode', req.runtimeMode.trim());
  if (Is.str(req.entrypoint) && hasValue(req.entrypoint)) args.push('--entrypoint', req.entrypoint.trim());
  if (Is.str(req.workingDirectory) && hasValue(req.workingDirectory)) {
    args.push('--working-directory', req.workingDirectory.trim());
  }
  args.push(root);

  return {
    cmd: D.cmd.deno,
    cwd: root as t.StringDir,
    args,
  } as const;
}

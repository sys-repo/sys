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

  const args = ['deploy', 'create', '--app', app];
  if (Is.str(req.org) && hasValue(req.org)) args.push('--org', req.org.trim());
  if (Is.str(req.token) && hasValue(req.token)) args.push('--token', req.token.trim());
  if (req.dryRun === true) args.push('--dry-run');
  if (Is.str(req.root) && hasValue(req.root)) args.push(Path.resolve(req.root.trim()));

  return {
    cmd: D.cmd.deno,
    cwd: Deno.cwd() as t.StringDir,
    args,
  } as const;
}

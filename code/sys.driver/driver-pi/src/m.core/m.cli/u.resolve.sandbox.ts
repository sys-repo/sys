import { type t } from './common.ts';
import { PiEnv } from './u.env.ts';
import { resolveRead } from './u.resolve.read.ts';
import { resolveWrite } from './u.resolve.write.ts';
import { PiArgs } from './u.args.ts';
import {
  isAncestorDiscoveryRead,
  toAncestorDiscoveryReadScope,
} from './u.ancestor.discovery.read.ts';

const SHELLS = new Set(['/bin/bash', '/bin/sh', '/bin/zsh']);

export async function resolveSandboxSummary(args: {
  cwd: t.PiCli.Cwd;
  read?: readonly t.StringPath[];
  write?: readonly t.StringPath[];
  allowAll?: boolean;
  context?: t.PiCli.SandboxSummary['context'];
}): Promise<t.PiCli.SandboxSummary> {
  const root = runtimeRoot(args.cwd);
  const denoDir = PiArgs.toDenoDir(root);
  const tmpDir = await PiEnv.toTmpDir();
  const read = await resolveRead(root, denoDir, [
    ...(args.read ?? []),
    ...toAncestorDiscoveryReadScope(args.cwd),
  ]);
  const write = await resolveWrite(root, args.write ?? []);

  const context = toContext(args.context);

  return {
    permissions: args.allowAll === true ? 'allow-all' : 'scoped',
    cwd: args.cwd,
    read: toReadScope(args.cwd, root, read, tmpDir),
    write: toWriteScope(root, write, tmpDir),
    context,
  };
}

function runtimeRoot(cwd: t.PiCli.Cwd): t.StringDir {
  const root = cwd.root ?? cwd.git;
  if (!root) throw new Error('Pi sandbox summary requires a resolved runtime root.');
  return root;
}

function toReadScope(
  cwd: t.PiCli.Cwd,
  root: t.StringDir,
  paths: readonly t.StringPath[],
  tmpDir?: t.StringDir,
): t.PiCli.SandboxSummary.Scope {
  const groups = new Set<string>(['cwd']);
  const detail: t.StringPath[] = [];

  for (const path of unique(paths)) {
    if (path === root) continue;

    if (isRuntimeRead(root, path, tmpDir) || isAncestorDiscoveryRead(cwd, path)) {
      groups.add('runtime');
      detail.push(path);
      continue;
    }

    groups.add('extra');
    detail.push(path);
  }

  return {
    summary: [...groups],
    detail: detail.length > 0 ? detail : undefined,
  };
}

function toContext(
  input?: t.PiCli.SandboxSummary['context'],
): t.PiCli.SandboxSummary['context'] {
  return { include: unique(input?.include ?? []) };
}

function toWriteScope(
  cwd: t.StringDir,
  paths: readonly t.StringPath[],
  tmpDir?: t.StringDir,
): t.PiCli.SandboxSummary.Scope {
  const groups = new Set<string>(['cwd']);
  const detail: t.StringPath[] = [];

  for (const path of unique(paths)) {
    if (path === cwd) continue;
    if (isTempPath(path, tmpDir)) groups.add('temp');
    else groups.add('extra');
    detail.push(path);
  }

  return {
    summary: [...groups],
    detail: detail.length > 0 ? detail : undefined,
  };
}

function unique(paths: readonly t.StringPath[]) {
  const seen = new Set<string>();
  const next: t.StringPath[] = [];
  for (const path of paths) {
    if (seen.has(path)) continue;
    seen.add(path);
    next.push(path);
  }
  return next;
}

function isRuntimeRead(cwd: t.StringDir, path: t.StringPath, tmpDir?: t.StringDir) {
  return (
    path === PiArgs.toDenoDir(cwd) ||
    path === PiEnv.toShellPath() ||
    SHELLS.has(path) ||
    isTempPath(path, tmpDir)
  );
}

function isTempPath(path: t.StringPath, tmpDir?: t.StringDir) {
  return tmpDir ? path === tmpDir || path.startsWith(`${tmpDir}/`) : false;
}

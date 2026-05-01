import { type t } from './common.ts';
import { PiEnv } from './u.env.ts';
import { resolveRead } from './u.resolve.read.ts';
import { resolveWrite } from './u.resolve.write.ts';
import { PiArgs } from './u.args.ts';

const SHELLS = new Set(['/bin/bash', '/bin/sh', '/bin/zsh']);

export async function resolveSandboxSummary(args: {
  cwd: t.PiCli.Cwd;
  read?: readonly t.StringPath[];
  write?: readonly t.StringPath[];
  allowAll?: boolean;
  context?: t.PiCli.SandboxSummary['context'];
}): Promise<t.PiCli.SandboxSummary> {
  const denoDir = PiArgs.toDenoDir(args.cwd.git);
  const tmpDir = await PiEnv.toTmpDir();
  const read = await resolveRead(args.cwd.git, denoDir, args.read ?? []);
  const write = await resolveWrite(args.cwd.git, args.write ?? []);

  const context = toContext(args.context);

  return {
    permissions: args.allowAll === true ? 'allow-all' : 'scoped',
    cwd: args.cwd,
    read: toReadScope(args.cwd.git, read, tmpDir),
    write: toWriteScope(args.cwd.git, write, tmpDir),
    context,
  };
}

function toReadScope(
  cwd: t.StringDir,
  paths: readonly t.StringPath[],
  tmpDir?: t.StringDir,
): t.PiCli.SandboxSummary.Scope {
  const groups = new Set<string>(['cwd']);
  const detail: t.StringPath[] = [];

  for (const path of unique(paths)) {
    if (path === cwd) continue;

    if (isRuntimeRead(cwd, path, tmpDir)) {
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

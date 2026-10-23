import { Arr, type t } from '../common.ts';
import { PiEnv } from './u.env.ts';
import { resolveRead } from './u.resolve.read.ts';
import { resolveWrite } from './u.resolve.write.ts';
import { PiArgs } from './u.args.ts';
import {
  isAncestorDiscoveryRead,
  toAncestorDiscoveryReadScope,
} from './u.ancestor.discovery.read.ts';
import { resolveTempArtifactRoots, runtimeRoot } from './u.runtime.ts';

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
  const tempArtifactRoots = await resolveTempArtifactRoots();
  const read = await resolveRead(root, denoDir, [
    ...(args.read ?? []),
    ...toAncestorDiscoveryReadScope(args.cwd),
  ]);
  const write = await resolveWrite(root, args.write ?? []);

  const context = toContext(args.context);

  return {
    permissions: args.allowAll === true ? 'allow-all' : 'scoped',
    cwd: args.cwd,
    read: toReadScope(args.cwd, root, read, tempArtifactRoots),
    write: toWriteScope(root, write, tempArtifactRoots),
    context,
  };
}

function toReadScope(
  cwd: t.PiCli.Cwd,
  root: t.StringDir,
  paths: readonly t.StringPath[],
  tempArtifactRoots: readonly t.StringPath[],
): t.PiCli.SandboxSummary.Scope {
  const groups = new Set<string>(['cwd']);
  const detail: t.StringPath[] = [];

  for (const path of Arr.uniq(paths)) {
    if (path === root) continue;

    if (isRuntimeRead(root, path, tempArtifactRoots) || isAncestorDiscoveryRead(cwd, path)) {
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
  return { include: Arr.uniq(input?.include ?? []) };
}

function toWriteScope(
  cwd: t.StringDir,
  paths: readonly t.StringPath[],
  tempArtifactRoots: readonly t.StringPath[],
): t.PiCli.SandboxSummary.Scope {
  const groups = new Set<string>(['cwd']);
  const detail: t.StringPath[] = [];

  for (const path of Arr.uniq(paths)) {
    if (path === cwd) continue;
    if (isTempArtifactPath(path, tempArtifactRoots)) groups.add('temp');
    else groups.add('extra');
    detail.push(path);
  }

  return {
    summary: [...groups],
    detail: detail.length > 0 ? detail : undefined,
  };
}

function isRuntimeRead(
  cwd: t.StringDir,
  path: t.StringPath,
  tempArtifactRoots: readonly t.StringPath[],
) {
  return (
    path === PiArgs.toDenoDir(cwd) ||
    path === PiEnv.toShellPath() ||
    SHELLS.has(path) ||
    isTempArtifactPath(path, tempArtifactRoots)
  );
}

function isTempArtifactPath(path: t.StringPath, roots: readonly t.StringPath[]) {
  return roots.some((root) => path === root || path.startsWith(`${root}/`));
}

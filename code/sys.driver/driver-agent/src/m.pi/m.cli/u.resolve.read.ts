import { Fs, Path, type t } from './common.ts';
import { PiEnv } from './u.env.ts';

export async function resolveRead(
  cwd: t.StringDir,
  denoDir: t.StringDir,
  extra: readonly t.StringPath[] = [],
) {
  const scope = new Set<string>([cwd, denoDir]);
  for (const path of extra) scope.add(path);
  for (const path of toExecutableReadScope()) scope.add(path);
  const tmpDir = PiEnv.toTmpDir();
  if (tmpDir) scope.add(tmpDir);
  const agentsSkillsDir = PiEnv.toAgentsSkillsDir();
  if (agentsSkillsDir) scope.add(agentsSkillsDir);
  const googleCredentialPath = PiEnv.toGoogleCredentialPath();
  if (googleCredentialPath) scope.add(googleCredentialPath);
  for (const path of toAncestorContextPaths(cwd)) scope.add(path);
  const gitRoot = await findGitRoot(cwd);
  if (!gitRoot) return [...scope];

  scope.add(gitRoot);
  for (const path of await toBootstrapContextPaths(gitRoot)) scope.add(path);

  return [...scope];
}

/**
 * Helpers:
 */
function toExecutableReadScope() {
  const scope = new Set<string>(['/bin/bash', '/bin/sh', '/bin/zsh']);
  scope.add(PiEnv.toShellPath());
  return [...scope];
}

function toAncestorContextPaths(dir: t.StringDir) {
  const paths: string[] = [];
  let current = dir;
  while (true) {
    paths.push(Fs.join(current, 'AGENTS.md'));
    /**
     * Pi still probes `CLAUDE.md` during startup. Allow this read for upstream
     * compatibility only; it is not part of the intended `@sys` context contract.
     */
    paths.push(Fs.join(current, 'CLAUDE.md'));
    /**
     * Pi probes ancestor git markers while auto-discovering repo resources.
     * Allow these marker reads so startup stays non-interactive within the
     * caller's cwd ancestry, without broadening scope to full ancestor dirs.
     */
    paths.push(Fs.join(current, '.git'));
    /**
     * Pi auto-discovers `.agents/skills` along the cwd ancestry up to the git
     * repo root. Allow these directory probes explicitly for compatibility.
     */
    paths.push(Fs.join(current, '.agents', 'skills'));
    const parent = Path.dirname(current) as t.StringDir;
    if (parent === current) return paths;
    current = parent;
  }
}

async function toBootstrapContextPaths(gitRoot: t.StringDir) {
  const paths = new Set<string>();
  const parent = Path.dirname(gitRoot) as t.StringDir;
  const parentAgents = Fs.join(parent, 'AGENTS.md');
  if (await Fs.stat(parentAgents)) paths.add(parentAgents);

  const canonRoot = Fs.join(parent, 'sys.canon') as t.StringDir;
  const canonAgents = Fs.join(canonRoot, 'AGENTS.md');
  if (!(await Fs.stat(canonAgents))) return [...paths];

  paths.add(canonAgents);

  const canonDir = Fs.join(canonRoot, '-canon') as t.StringDir;
  if (!(await Fs.stat(canonDir))) return [...paths];

  for await (const entry of Fs.walk(canonDir, { includeDirs: false })) {
    paths.add(entry.path);
  }

  return [...paths];
}

async function findGitRoot(dir: t.StringDir): Promise<t.StringDir | undefined> {
  let current = dir;
  while (true) {
    if (await Fs.stat(Fs.join(current, '.git'))) return current;
    const parent = Path.dirname(current) as t.StringDir;
    if (parent === current) return undefined;
    current = parent;
  }
}

import { Is, Json, Path, Process, Semver, type t } from '../common.ts';

/**
 * Classify changed packages by their baseline manifest version state.
 */
export async function classify(args: {
  readonly cwd: t.StringDir;
  readonly ref: string;
  readonly collect: t.WorkspaceBump.CollectResult;
  readonly delta: t.WorkspaceDelta.Result;
}) {
  const candidates = new Map(
    args.collect.candidates.map((candidate) => [candidate.pkgPath, candidate] as const),
  );
  const alreadyBumpedPkgPaths: t.StringPath[] = [];
  const needsBumpPkgPaths: t.StringPath[] = [];
  const newPkgPaths: t.StringPath[] = [];

  for (const pkgPath of args.delta.changedPkgPaths) {
    const candidate = candidates.get(pkgPath);
    if (!candidate) continue;
    const baseline = await baselineVersion({ cwd: args.cwd, ref: args.ref, candidate });
    if (!baseline) {
      newPkgPaths.push(pkgPath);
    } else if (Semver.Is.eql(candidate.version.current, baseline)) {
      needsBumpPkgPaths.push(pkgPath);
    } else {
      alreadyBumpedPkgPaths.push(pkgPath);
    }
  }

  return { alreadyBumpedPkgPaths, needsBumpPkgPaths, newPkgPaths };
}

async function baselineVersion(args: {
  readonly cwd: t.StringDir;
  readonly ref: string;
  readonly candidate: t.WorkspaceBump.Candidate;
}) {
  const path = Path.trimCwd(args.candidate.denoFilePath, { cwd: args.cwd });
  const output = await Process.invoke({
    cmd: 'git',
    cwd: args.cwd,
    args: ['show', `${args.ref}:${path}`],
    silent: true,
  });
  if (!output.success) return undefined;

  const parsed = Json.safeParse<Record<string, unknown>>(output.text.stdout, {}, { jsonc: true });
  if (!parsed.ok) throw new Error(`Could not parse baseline manifest at ${args.ref}:${path}.`);

  const version = parsed.data.version;
  if (!Is.str(version)) return undefined;
  return Semver.parse(version).version;
}

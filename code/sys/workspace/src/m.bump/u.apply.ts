import { Fs, Json, Process, Semver, type t } from './common.ts';

export const apply: t.WorkspaceBump.Lib['apply'] = async (args) => {
  const cwd = args.cwd ?? Fs.cwd();
  const writes = await writePlan(args.plan);
  const followups = toFollowups({ cwd, plan: args.plan, policy: args.policy });
  await runFollowups(followups);
  return { plan: args.plan, writes, followups };
};

export async function writePlan(plan: t.WorkspaceBump.PlanResult) {
  const writes: t.WorkspaceBump.WriteResult[] = [];
  for (const candidate of plan.selected) {
    const res = await Fs.readJson<Record<string, unknown>>(candidate.denoFilePath);
    if (!res.data) {
      const err = `Workspace.Bump.apply: failed to load '${candidate.denoFilePath}'`;
      throw new Error(err);
    }

    const denofile = { ...res.data, version: Semver.toString(candidate.version.next) };
    const json = `${Json.stringify(denofile, '  ')}\n`;
    await Fs.write(candidate.denoFilePath, json);
    writes.push({
      pkgPath: candidate.pkgPath,
      denoFilePath: candidate.denoFilePath,
      previous: candidate.version.current,
      next: candidate.version.next,
    });
  }
  return writes;
}

export function toFollowups(args: {
  readonly cwd: t.StringDir;
  readonly plan: t.WorkspaceBump.PlanResult;
  readonly policy?: t.WorkspaceBump.Policy;
}) {
  return [...(args.policy?.followups?.({ cwd: args.cwd, plan: args.plan }) ?? [])];
}

export async function runFollowups(followups: readonly t.WorkspaceBump.Followup[]) {
  for (const followup of followups) {
    await runFollowup(followup);
  }
}

export async function runFollowup(followup: t.WorkspaceBump.Followup) {
  const res = await Process.inherit({
    cmd: followup.cmd,
    args: [...(followup.args ?? [])],
    cwd: followup.cwd,
  });
  if (res.success) return;
  const command = [followup.cmd, ...(followup.args ?? [])].join(' ');
  throw new Error(`Failed ${followup.label}: ${command}`);
}

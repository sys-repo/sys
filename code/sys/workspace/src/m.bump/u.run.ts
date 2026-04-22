import { runPhase } from '../u.phase.ts';
import { c, Cli, Dir, Fs, Path, type t } from './common.ts';
import { Fmt } from './m.Fmt.ts';
import { runFollowup, toFollowups, writePlan } from './u.apply.ts';
import { collect } from './u.collect.ts';
import { plan } from './u.plan.ts';

export const run: t.WorkspaceBump.Lib['run'] = async (args = {}) => {
  const cwd = args.cwd ?? Fs.cwd();
  const log = args.log ?? true;
  const spinner = Cli.Spinner.create('');
  args.progress?.({ kind: 'collect' });
  const collected = await runPhase({
    spinner,
    label: Fmt.phase({ kind: 'collect' }),
    silent: !log,
    fn: () => collect({ cwd, release: args.release, policy: args.policy }),
  });
  const selected = await wrangle.select({
    candidates: [...collected.candidates],
    release: collected.release,
    from: args.from ? [...args.from] : undefined,
  });
  if (selected.prompted) console.clear();
  args.progress?.({ kind: 'plan' });
  const planned = await runPhase({
    spinner,
    label: Fmt.phase({ kind: 'plan' }),
    silent: !log,
    fn: () => plan({ collect: collected, rootPkgPaths: selected.pkgPaths }),
  });

  const selectedPaths = new Set(planned.selectedPaths);
  if (log) {
    const table = Cli.table(['Module', 'Current', '', 'Next']);
    collected.candidates.forEach((candidate) => {
      table.push(Fmt.preflightRow({ candidate, selectedPaths, release: collected.release }));
    });
    console.info();
    for (const line of Fmt.planSummary({ plan: planned })) console.info(line);
    console.info();
    console.info(c.gray(table.toString()));
    console.info();
  }

  if (args.dryRun) {
    if (log) {
      console.info(Fmt.dryRun());
      console.info();
    }
    return { collect: collected, plan: planned, dryRun: true };
  }

  const confirmed = args.nonInteractive ? true : await wrangle.confirm();
  if (!confirmed) return { collect: collected, plan: planned, dryRun: false };

  args.progress?.({ kind: 'integrity' });
  const untouched = await runPhase({
    spinner,
    label: Fmt.phase({ kind: 'integrity', followup: 'package integrity baseline' }),
    silent: !log,
    fn: () => wrangle.snapshotUnselected(collected.candidates, planned.selectedPaths),
  });
  args.progress?.({ kind: 'apply' });
  const writes = await runPhase({
    spinner,
    label: Fmt.phase({ kind: 'apply' }),
    silent: !log,
    fn: () => writePlan(planned),
  });
  const followups = toFollowups({ cwd, plan: planned, policy: args.policy });
  if (followups.length > 0) {
    for (const followup of followups) {
      args.progress?.({ kind: 'followup' });
      await runPhase({
        spinner,
        label: Fmt.phase({ kind: 'followup', followup: followup.label }),
        silent: !log,
        render: 'line',
        fn: () => runFollowup(followup),
      });
    }
  }
  args.progress?.({ kind: 'integrity' });
  await runPhase({
    spinner,
    label: Fmt.phase({ kind: 'integrity' }),
    silent: !log,
    fn: () =>
      wrangle.assertUnselectedStable(collected.candidates, planned.selectedPaths, untouched),
  });

  return {
    collect: collected,
    plan: planned,
    apply: { plan: planned, writes, followups },
    dryRun: false,
  };
};

const wrangle = {
  async select(args: {
    candidates: readonly t.WorkspaceBump.Candidate[];
    release: t.SemverReleaseType;
    from?: readonly string[];
  }): Promise<{ readonly pkgPaths: readonly t.StringPath[]; readonly prompted: boolean }> {
    if (args.from && args.from.length > 0) {
      const pkgPaths = wrangle.resolveFrom(args.candidates, args.from);
      return { pkgPaths, prompted: false };
    }

    const layout = Fmt.selectionLayout(args.candidates);
    const options = args.candidates.map((candidate) => ({
      name: Fmt.selectionLabel({ candidate, layout, release: args.release }),
      value: candidate.pkgPath,
    }));

    let message = `Which packages should start the ${c.cyan(args.release)} bump`;
    message += ` ${c.gray(`(${args.candidates.length.toLocaleString()} total)`)}`;

    const picked = await Cli.Input.Checkbox.prompt<t.StringPath>({
      message,
      maxRows: Math.min(50, args.candidates.length),
      minOptions: 1,
      options,
    });
    return { pkgPaths: wrangle.unique(picked ?? []), prompted: true };
  },

  resolveFrom(candidates: readonly t.WorkspaceBump.Candidate[], input: readonly string[]) {
    const resolved: t.StringPath[] = [];

    for (const value of input) {
      const trimmed = value.trim();
      const pkgPath = candidates.find((candidate) => candidate.pkgPath === trimmed)?.pkgPath ??
        candidates.find((candidate) => candidate.name === trimmed)?.pkgPath;
      if (!pkgPath) throw new Error(`Unknown bump root: ${value}`);
      resolved.push(pkgPath);
    }

    return wrangle.unique(resolved);
  },

  unique(values: readonly t.StringPath[]) {
    return [...new Set(values)];
  },

  async confirm() {
    const answer = await Cli.Input.Select.prompt<'save' | 'cancel'>({
      message: 'Apply update plan:\n',
      options: [
        { name: c.green(c.bold('Save')), value: 'save' },
        { name: c.gray('Cancel'), value: 'cancel' },
      ],
      default: 'save',
      hideDefault: true,
    });
    return answer === 'save';
  },

  async snapshotUnselected(
    candidates: readonly t.WorkspaceBump.Candidate[],
    selectedPaths: readonly t.StringPath[],
  ) {
    const selected = new Set(selectedPaths);
    const snapshots = new Map<t.StringPath, string>();
    for (const candidate of candidates) {
      if (selected.has(candidate.pkgPath)) continue;
      const dir = Path.dirname(candidate.denoFilePath);
      const res = await Dir.Hash.compute(dir);
      snapshots.set(candidate.pkgPath, res.hash.digest);
    }
    return snapshots;
  },

  async assertUnselectedStable(
    candidates: readonly t.WorkspaceBump.Candidate[],
    selectedPaths: readonly t.StringPath[],
    before: ReadonlyMap<t.StringPath, string>,
  ) {
    const selected = new Set(selectedPaths);
    const changed: t.WorkspaceBump.Candidate[] = [];
    for (const candidate of candidates) {
      if (selected.has(candidate.pkgPath)) continue;
      const dir = Path.dirname(candidate.denoFilePath);
      const res = await Dir.Hash.compute(dir);
      if (before.get(candidate.pkgPath) === res.hash.digest) continue;
      changed.push(candidate);
    }
    if (changed.length === 0) return;

    const list = changed.map((candidate) => `${candidate.name} (${candidate.pkgPath})`).join(', ');
    throw new Error(`Bump followups changed unbumped packages: ${list}`);
  },
} as const;

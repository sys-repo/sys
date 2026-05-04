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
  let planned = await wrangle.planSelection({
    clear: selected.prompted,
    collect: collected,
    log,
    rootPkgPaths: selected.pkgPaths,
    spinner,
    progress: args.progress,
  });

  if (args.dryRun) {
    if (log) {
      console.info(Fmt.dryRun());
      console.info();
    }
    return { collect: collected, plan: planned, dryRun: true };
  }

  if (!args.nonInteractive) {
    const allowBack = !args.from?.length;
    let confirmed = await wrangle.confirm({ allowBack });
    while (allowBack && confirmed === 'back') {
      const next = await wrangle.select({
        candidates: [...collected.candidates],
        release: collected.release,
      });
      planned = await wrangle.planSelection({
        clear: next.prompted,
        collect: collected,
        log,
        rootPkgPaths: next.pkgPaths,
        spinner,
        progress: args.progress,
      });
      confirmed = await wrangle.confirm({ allowBack });
    }
    if (confirmed !== 'save') return { collect: collected, plan: planned, dryRun: false };
  }

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
  async planSelection(args: {
    clear: boolean;
    collect: t.WorkspaceBump.CollectResult;
    log: boolean;
    progress?: t.WorkspaceBump.ProgressHandler;
    rootPkgPaths: readonly t.StringPath[];
    spinner: t.CliSpinner.Instance;
  }) {
    if (args.clear) console.clear();
    args.progress?.({ kind: 'plan' });
    const planned = await runPhase({
      spinner: args.spinner,
      label: Fmt.phase({ kind: 'plan' }),
      silent: !args.log,
      fn: () => plan({ collect: args.collect, rootPkgPaths: args.rootPkgPaths }),
    });

    const selectedPaths = new Set(planned.selectedPaths);
    if (args.log) {
      const table = Cli.table(['Module', 'Current', '', 'Next']);
      args.collect.candidates.forEach((candidate) => {
        table.push(Fmt.preflightRow({
          candidate,
          selectedPaths,
          release: args.collect.release,
        }));
      });
      console.info();
      for (const line of Fmt.planSummary({ plan: planned })) console.info(line);
      console.info();
      console.info(c.gray(table.toString()));
      console.info();
    }

    return planned;
  },

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

  async confirm(args: { allowBack: boolean }) {
    const options: { name: string; value: 'save' | 'back' | 'cancel' }[] = [
      { name: `  ${c.green('save')}`, value: 'save' },
    ];
    if (args.allowBack) options.push({ name: `${c.cyan('←')} ${c.gray('back')}`, value: 'back' });
    options.push({ name: `  ${c.gray('cancel')}`, value: 'cancel' });

    return await Cli.Input.Select.prompt<'save' | 'back' | 'cancel'>({
      message: '',
      options,
      default: 'save',
      hideDefault: true,
    });
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
      const res = await Dir.Hash.compute(dir, snapshotFilter(dir));
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
      const res = await Dir.Hash.compute(dir, snapshotFilter(dir));
      if (before.get(candidate.pkgPath) === res.hash.digest) continue;
      changed.push(candidate);
    }
    if (changed.length === 0) return;

    const list = changed.map((candidate) => `${candidate.name} (${candidate.pkgPath})`).join(', ');
    throw new Error(`Bump followups changed unbumped packages: ${list}`);
  },
} as const;

const AmbientSnapshotSegments = new Set(['.git', '.pi', '.tmp', 'node_modules', 'dist']);
const AmbientSnapshotFiles = new Set(['.DS_Store']);

function snapshotFilter(dir: t.StringDir) {
  return (path: string) => {
    const relative = path.slice(dir.length + 1);
    const parts = relative.split('/');
    return !parts.some((part: string) => {
      return AmbientSnapshotSegments.has(part) || AmbientSnapshotFiles.has(part);
    });
  };
}

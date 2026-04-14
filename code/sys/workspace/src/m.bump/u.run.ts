import { runPhase } from '../u.phase.ts';
import { c, Cli, Fs, type t } from './common.ts';
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
    fn: () => collect({
      cwd,
      release: args.release,
      policy: args.policy,
    }),
  });
  const selected = await wrangle.select({
    candidates: collected.candidates,
    release: collected.release,
    from: args.from,
  });
  if (selected.prompted) console.clear();
  args.progress?.({ kind: 'plan' });
  const planned = await runPhase({
    spinner,
    label: Fmt.phase({ kind: 'plan' }),
    silent: !log,
    fn: () => plan({ collect: collected, rootPkgPath: selected.pkgPath }),
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

  return {
    collect: collected,
    plan: planned,
    apply: { plan: planned, writes, followups },
    dryRun: false,
  };
};

const wrangle = {
  async select(args: {
    readonly candidates: readonly t.WorkspaceBump.Candidate[];
    readonly release: t.SemverReleaseType;
    readonly from?: string;
  }): Promise<{ readonly pkgPath: t.StringPath; readonly prompted: boolean }> {
    if (args.from) {
      const pkgPath = wrangle.resolveFrom(args.candidates, args.from);
      if (!pkgPath) throw new Error(`Unknown bump root: ${args.from}`);
      return { pkgPath, prompted: false };
    }

    const layout = Fmt.selectionLayout(args.candidates);
    const options = args.candidates.map((candidate) => ({
      name: Fmt.selectionLabel({ candidate, layout, release: args.release }),
      value: candidate.pkgPath,
    }));
    const total = args.candidates.length.toLocaleString();
    const picked = await Cli.Input.Select.prompt<t.StringPath>({
      message: `${c.cyan('›')} which package should start the ${c.cyan(args.release)} bump ${
        c.gray(`(${total} total)`)
      }:\n`,
      maxRows: Math.min(50, args.candidates.length),
      options,
      default: args.candidates[0]?.pkgPath,
      hideDefault: true,
    });
    return { pkgPath: picked, prompted: true };
  },

  resolveFrom(candidates: readonly t.WorkspaceBump.Candidate[], input: string) {
    const trimmed = input.trim();
    return candidates.find((candidate) => candidate.pkgPath === trimmed)?.pkgPath ??
      candidates.find((candidate) => candidate.name === trimmed)?.pkgPath;
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
} as const;

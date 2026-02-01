import { type t, c, Cli } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { selectBundleProfile, selectBundleProfileAction } from './u.menu.ts';
import { runProfile, type BundleRunProgress, type BundleRunSummary } from './u.profile.ts';

/**
 * Run the bundler using the given CRDT commands
 */
export const run: t.SlugBundleLib['run'] = async (args) => {
  if (!args.interactive) {
    const pick = await selectBundleProfile(args.cwd, { interactive: false });
    if (pick.kind !== 'run') return { kind: 'stay' };
    await runOnce({ cwd: args.cwd, cmd: args.cmd, profilePath: pick.profile });
    return { kind: 'stay' };
  }

  let lastProfile: t.StringFile | undefined;
  let lastAction: 'run' | undefined;

  profileLoop: while (true) {
    let actionPick = await selectBundleProfile(args.cwd, {
      interactive: true,
      defaultProfile: lastProfile,
    });

    if (actionPick.kind === 'exit') return { kind: 'stay' };
    if ('profile' in actionPick && actionPick.profile) lastProfile = actionPick.profile;

    while (true) {
      if (actionPick.kind === 'run') {
        lastAction = 'run';
        if (actionPick.profile) {
          await runOnce({ cwd: args.cwd, cmd: args.cmd, profilePath: actionPick.profile });
        }
        actionPick = await selectBundleProfileAction(args.cwd, actionPick.profile, {
          defaultAction: lastAction,
        });
        if ('profile' in actionPick && actionPick.profile) {
          lastProfile = actionPick.profile;
        }
        continue;
      }

      if (actionPick.kind === 'exit') return { kind: 'stay' } as const;
      if (actionPick.kind === 'back') {
        lastAction = undefined;
        continue profileLoop;
      }
      break;
    }
  }
};

/**
 * Helpers:
 */
async function runOnce(args: {
  cwd: t.StringDir;
  cmd: t.Crdt.Cmd.Client;
  profilePath: t.StringFile;
}): Promise<void> {
  const spinner = Cli.spinner();
  spinner.start();
  spinner.text = Fmt.spinnerText('bundle...');

  const summary = await runProfile({
    ...args,
    onProgress: (info: BundleRunProgress) => {
      if (info.stage === 'media:seq') {
        spinner.text = Fmt.spinnerText(`media:seq ${info.current}/${info.total}`);
        return;
      }
      if (info.stage === 'slug-tree:fs') {
        spinner.text = Fmt.spinnerText('slug-tree:fs');
      }
    },
  });

  spinner.stop();
  printSummary(summary);
}

function printSummary(summary: BundleRunSummary) {
  const warnings = summary.warnings ?? [];
  for (const warning of warnings) {
    console.info(c.yellow(warning));
  }

  const table = Cli.table();
  const kv = (k: string, v: string = '') => table.push([c.gray(k), v]);

  if (summary.mediaSeq) {
    const issuesTotal = summary.mediaSeq.docs.reduce((acc, doc) => acc + doc.issues.total, 0);
    const docsWithIssues = summary.mediaSeq.docs.length;
    kv('media:seq bundled', `${summary.mediaSeq.bundled}/${summary.mediaSeq.total}`);
    kv('media:seq issues', `${issuesTotal} (${docsWithIssues} docs)`);
  }

  if (summary.slugTreeFs) {
    const elapsed = summary.slugTreeFs.elapsedMs;
    const elapsedText = elapsed > 0 ? `${(elapsed / 1000).toFixed(2)}s` : '0s';
    kv(
      'slug-tree:fs',
      `files=${summary.slugTreeFs.files}, manifests=${summary.slugTreeFs.manifests}, time=${elapsedText}`,
    );
  }

  const text = String(table);
  if (text.trim().length > 0) console.info(text, '\n');
}

import { type t, c, Cli } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { selectBundleProfile, selectBundleProfileAction } from './u.menu.ts';
import { BundleProfileMigrate } from './u.migrate.ts';
import { runProfile } from './u.profile.ts';

/**
 * Run the bundler using the given CRDT commands
 */
export const run: t.SlugBundleLib['run'] = async (args) => {
  if (args.cwd) {
    await BundleProfileMigrate.run(args.cwd);
  }
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
    onProgress: (info: t.BundleRunProgress) => {
      if (info.stage === 'media:seq') {
        const current = String(info.current);
        spinner.text = Fmt.spinnerText(`bundling media:seq (${c.white(current)}/${info.total})`);
        return;
      }
      if (info.stage === 'slug-tree:fs') {
        spinner.text = Fmt.spinnerText('bundling slug-tree:fs');
        return;
      }
      if (info.stage === 'slug:fs:yaml') {
        const current = String(info.current);
        spinner.text = Fmt.spinnerText(`materializing slug:fs:yaml (${c.white(current)}/${info.total})`);
      }
    },
  });

  spinner.stop();
  printSummary(summary);
}

function printSummary(summary: t.BundleRunSummary) {
  const warnings = summary.warnings ?? [];
  for (const warning of warnings) {
    printWarning(warning);
  }

  const table = Cli.table();
  const kv = (k: string, v: string = '') => table.push([c.gray(k), v]);

  if (summary.mediaSeq) {
    const issuesTotal = summary.mediaSeq.docs.reduce((acc, doc) => acc + doc.issues.total, 0);
    const docsWithIssues = summary.mediaSeq.docs.length;
    const mediaCounts = summarizeMediaIssues(summary.mediaSeq.docs);
    const parts: string[] = [];
    if (mediaCounts.image > 0) parts.push(`image=${mediaCounts.image}`);
    if (mediaCounts.video > 0) parts.push(`video=${mediaCounts.video}`);
    if (mediaCounts.other > 0) parts.push(`other=${mediaCounts.other}`);
    const kindSummary = parts.length > 0 ? `; ${parts.join(', ')}` : '';
    const mediaElapsed = summary.mediaSeq.elapsed ?? 0;
    const mediaElapsedText = mediaElapsed > 0 ? `${(mediaElapsed / 1000).toFixed(2)}s` : '0s';
    const total = summary.mediaSeq.total;
    const bundled = summary.mediaSeq.bundled;
    const countText = bundled === total ? `${bundled}` : `${bundled}/${total}`;
    kv('media:seq bundled', `${countText} docs, time=${mediaElapsedText}`);
    kv('media:seq issues', `${issuesTotal}${kindSummary} (${docsWithIssues} docs)`);
  }

  if (summary.slugTreeFs) {
    const elapsed = summary.slugTreeFs.elapsed;
    const elapsedText = elapsed > 0 ? `${(elapsed / 1000).toFixed(2)}s` : '0s';
    kv(
      'slug-tree:fs',
      `files=${summary.slugTreeFs.files}, manifests=${summary.slugTreeFs.manifests}, time=${elapsedText}`,
    );
  }

  if (summary.slugFsYaml) {
    const elapsed = summary.slugFsYaml.elapsed;
    const elapsedText = elapsed > 0 ? `${(elapsed / 1000).toFixed(2)}s` : '0s';
    kv('slug:fs:yaml', `${summary.slugFsYaml.written}/${summary.slugFsYaml.total} docs, time=${elapsedText}`);
    kv('slug:fs:yaml dir', summary.slugFsYaml.dir);
  }

  const text = String(table);
  if (text.trim().length > 0) console.info(text, '\n');
}

function printWarning(message: string) {
  const lines = String(message ?? '').split('\n');
  for (const line of lines) {
    const source = line.match(/^-\s*source:\s*(.+)$/);
    if (source) {
      console.info(`${c.yellow('- source:')}   ${c.gray(source[1])}`);
      continue;
    }

    const resolved = line.match(/^-\s*resolved:\s*(.+)$/);
    if (resolved) {
      console.info(`${c.yellow('- resolved:')} ${c.gray(resolved[1])}`);
      continue;
    }

    console.info(c.yellow(line));
  }
}

function summarizeMediaIssues(docs: readonly t.BundleRunDocSummary[]) {
  let image = 0;
  let video = 0;
  let other = 0;
  for (const doc of docs) {
    for (const [kind, count] of doc.issues.byKind.entries()) {
      if (kind.includes('image')) {
        image += count;
        continue;
      }
      if (kind.includes('video')) {
        video += count;
        continue;
      }
      other += count;
    }
  }
  return { image, video, other };
}

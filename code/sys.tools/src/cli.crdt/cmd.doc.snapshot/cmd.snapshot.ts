import { RepoProcess } from '../cmd.repo.daemon/mod.ts';

import { c, Cli, Crdt, Fs, Str, type t, Time } from '../common.ts';
import { CrdtReposFs } from '../u.config.repo/u.fs.ts';
import { Fmt } from '../u.fmt.ts';
import { calcAndSaveDist } from './u.calcAndSaveDist.ts';
import { walk } from './u.walk.ts';

const Tree = Cli.Fmt.Tree;

export async function snapshotCommand(cwd: t.StringDir, docid: t.Crdt.Id) {
  const ports = await CrdtReposFs.loadPorts(cwd);
  const port = ports.repo;
  const cmd = await RepoProcess.tryClient(port);
  if (!cmd) return;

  /**
   * Normalise the incoming id (may be "crdt:<id>" or bare).
   */
  const root = Crdt.Id.clean(docid) ?? (docid as t.Crdt.Id);
  await runSnapshot(root, (onProgress) =>
    walk({
      cmd,
      id: root,
      base: '-backup',
      yamlPath: ['slug'],
      onProgress,
    }));
}

type SnapshotWalk = (
  onProgress: (event: t.CrdtSnapshotProgress) => void,
) => ReturnType<typeof walk>;
type SnapshotOutput = {
  spinner?: (text: string) => { text: string; stop(): void };
  log?: (text?: string) => void;
};

/** Command work after client acquisition; Dist computation remains owned here. */
export async function runSnapshot(
  root: t.Crdt.Id,
  walkSnapshot: SnapshotWalk,
  output: SnapshotOutput = {},
) {
  const log = output.log ?? console.info;
  /**
   * Process snapshot/backup request.
   */
  const tableProcessed = Cli.table([]);
  const appendTable = (tbl: t.Cli.Table.Instance, e: t.CrdtSnapshotProgressSaved) => {
    const coloredId = Fmt.prettyUri(e.id);
    const branch = Tree.branch(false);
    const identity = c.gray(`${branch} ${e.isRoot ? c.white(coloredId) : coloredId}`);
    const bytes = (bytes: number) => Fmt.bytes(bytes, 1024 * 1024 /* warn at 1MB */);
    const size = c.gray(`${bytes(e.bytes.json)} json, ${bytes(e.bytes.binary)} binary`);
    tbl.push([identity, size]);
  };

  const tableText = () => {
    const str = Str.builder().line(c.gray('processing...'));
    str.line(Str.trimEdgeNewlines(String(tableProcessed)));
    return String(str);
  };

  const timer = Time.timer();
  const progress: t.CrdtSnapshotProgress[] = [];
  let res: Awaited<ReturnType<typeof walk>>;
  let info: Awaited<ReturnType<typeof calcAndSaveDist>>;
  const spinner = (output.spinner ?? Cli.spinner)(Fmt.spinnerText(tableText()));
  try {
    res = await walkSnapshot((e) => {
      progress.push(e);
      if (e.kind === 'doc:saved') appendTable(tableProcessed, e);
      spinner.text = Fmt.spinnerText(tableText());
    });
    info = await calcAndSaveDist(res.dir, root);
  } finally {
    spinner.stop();
  }

  /**
   * Print summary:
   */
  const total = res.processed.length;
  const completed = `${c.green('↑ snapshot backed up')}`;
  let summary = `across ${c.white(String(total))}`;
  summary += ` ${Str.plural(total, 'document', 'documents')} in ${String(timer.elapsed)}`;
  const totals = `${Str.bytes(res.bytes.json)} json, ${Str.bytes(res.bytes.binary)} binary`;

  tableProcessed.push([c.gray(Tree.vert)]);
  tableProcessed.push([c.gray(`${Tree.branch(true)} ${c.italic(completed)}`)]);
  tableProcessed.push([c.white(`   ${totals}`)]);
  tableProcessed.push([c.gray(`   ${c.italic(summary)}`)]);
  log(String(tableProcessed));

  /**
   * Warn on missing linked documents.
   */
  const notFound = progress
    .filter((e) => e.kind === 'doc:skip')
    .filter((e) => e.reason === 'not-found');

  if (notFound.length > 0) {
    const warnTable = Cli.table([]);
    warnTable.push([c.gray(Tree.vert)]);
    notFound.forEach((e, i, totalCount) => {
      const branch = Tree.branch([i, totalCount]);
      const skipped = c.gray(`${c.yellow('skipped')}; ${e.reason}`);
      warnTable.push([c.gray(`${branch} ${Fmt.prettyUri(e.id)}`), skipped]);
    });

    log();
    log(c.gray(`${c.yellow('Warning')} the following linked documents were not found:`));
    log(Str.trimEdgeNewlines(String(warnTable)));
  }

  /**
   * Print: snapshot digest/info
   */
  const bundleDir = c.dim(Fs.dirname(Fs.trimCwd(info.path)));
  const bundlePath = c.gray(`${bundleDir}/${Fs.basename(info.path)}`);
  const digest = info.dist.hash.digest;
  const hx = `${digest.slice(0, -5)}${c.green(digest.slice(-5))}`;

  const tblInfo = Cli.table([]);
  tblInfo.push([c.gray(`hash`), c.gray(hx)]);
  tblInfo.push([c.gray(`bundle`), bundlePath]);
  log();
  log(Str.trimEdgeNewlines(String(tblInfo)));
}

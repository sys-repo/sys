import { type t, c, Cli, Crdt, D, Fs, Str, Time } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { RepoProcess } from '../cmd.repo.daemon/mod.ts';
import { calcAndSaveDist } from './u.calcAndSaveDist.ts';
import { process } from './u.process.ts';

const Tree = Cli.Fmt.Tree;

export async function snapshot(dir: t.StringDir, id: t.Crdt.Id) {
  const port = D.port.repo;
  const cmd = await RepoProcess.tryClient(port);
  if (!cmd) return;

  /**
   * Normalise the incoming id (may be "crdt:<id>" or bare).
   */
  const root = Crdt.Id.clean(id) ?? (id as t.Crdt.Id);

  /**
   * Process snapshot/backup request.
   */
  const tableProcessed = Cli.table([]);
  const appendTable = (tbl: t.CliTable, e: t.CrdtSnapshotProgressSaved) => {
    const coloredId = Fmt.prettyUri(e.id);
    const branch = Tree.branch(false);
    const identity = c.gray(`${branch} ${e.isRoot ? c.white(coloredId) : coloredId}`);
    const warnAt = 1024 * 1024; // 1-MB
    const bytes = (bytes: number) => {
      const s = Str.bytes(bytes);
      return bytes > warnAt ? c.yellow(s) : s;
    };
    tbl.push([identity, c.gray(`${bytes(e.bytes.json)} json, ${bytes(e.bytes.binary)} binary`)]);
  };

  const tableText = () => {
    const str = Str.builder().line(c.gray('processing...'));
    str.line(Str.trimEdgeNewlines(String(tableProcessed)));
    return String(str);
  };

  const spinner = Cli.spinner(tableText());
  const timer = Time.timer();
  const progress: t.CrdtSnapshotProgress[] = [];

  const res = await process({
    cmd,
    id: root,
    base: '-backup',
    yamlPath: ['slug'],
    onProgress(e) {
      progress.push(e);
      if (e.kind === 'doc:saved') appendTable(tableProcessed, e);
      spinner.text = tableText();
    },
  });

  spinner.stop();

  /**
   * Save dist.json (meta-data and pkg/file hashes)
   */
  const info = await calcAndSaveDist(res.dir, root);

  /**
   * Print summary:
   */
  const total = res.processed.length;
  const completed = `${c.green('↑ completed snapshot')}`;
  let summary = `across ${total}`;
  summary += ` ${Str.plural(total, 'document', 'documents')} in ${String(timer.elapsed)}`;
  const totals = `${Str.bytes(res.bytes.json)} json, ${Str.bytes(res.bytes.binary)} binary`;

  tableProcessed.push([c.gray(Tree.vert)]);
  tableProcessed.push([c.gray(`${Tree.branch(true)} ${c.italic(completed)}`)]);
  tableProcessed.push([c.white(`   ${totals}`)]);
  tableProcessed.push([c.gray(`   ${c.italic(summary)}`)]);
  console.info(String(tableProcessed));

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

    console.info();
    console.info(c.gray(`${c.yellow('Warning')} the following linked documents were not found:`));
    console.info(Str.trimEdgeNewlines(String(warnTable)));
  }

  /**
   * Print: snapshot digest/info
   */
  const bundleDir = c.dim(Fs.dirname(Fs.trimCwd(info.path)));
  let bundlePath = c.gray(`${bundleDir}/${Fs.basename(info.path)}`);
  const digest = info.dist.hash.digest;
  let hx = `${digest.slice(0, -5)}${c.green(digest.slice(-5))}`;

  const tblInfo = Cli.table([]);
  tblInfo.push([c.gray(`hash`), c.gray(hx)]);
  tblInfo.push([c.gray(`bundle`), bundlePath]);
  console.info();
  console.info(Str.trimEdgeNewlines(String(tblInfo)));
}

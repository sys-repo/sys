import { type t, c, Cli, Crdt, Str, Time } from '../common.ts';
import { startRepoWorker } from '../worker/mod.ts';
import { process } from './u.snapshot.process.ts';

const Tree = Cli.Fmt.Tree;

export async function snapshot(dir: t.StringDir, id: t.StringId) {
  /**
   * Prepare CRDT repository on background worker.
   */
  const spinner = Cli.spinner();
  const repo = await startRepoWorker(dir);
  spinner.stop();

  /**
   * Normalise the incoming id (may be "crdt:<id>" or bare).
   */
  const rootId = Crdt.Id.clean(id) ?? (id as t.Crdt.Id);

  /**
   * Process snapshot/backup request.
   */
  const table = Cli.table([]);
  const formatId = (value: string) => `crdt:${value.slice(0, -5)}${c.green(value.slice(-5))}`;
  const appendTable = (tbl: t.CliTable, e: t.CrdtSnapshotProgressSaved) => {
    const coloredId = formatId(e.id);
    const branch = Tree.branch(false);
    const identity = c.gray(`${branch} ${e.isRoot ? c.white(coloredId) : coloredId}`);
    tbl.push([identity, c.gray(Str.bytes(e.bytes))]);
  };

  const tableText = () => {
    const str = Str.builder().line(c.gray('processing...'));
    str.line(Str.trimEdgeNewlines(String(table)));
    return String(str);
  };

  spinner.start(tableText());

  const timer = Time.timer();
  const progress: t.CrdtSnapshotProgress[] = [];

  const res = await process({
    repo,
    id: rootId,
    base: '-backup',
    onProgress(e) {
      progress.push(e);
      if (e.kind === 'doc:saved') appendTable(table, e);
      spinner.text = tableText();
    },
  });

  spinner.stop();

  /**
   * Print summary:
   */
  const total = res.processed.length;
  const completed = `${c.green('↑ completed snapshot')}`;
  const summary = `${c.white(Str.bytes(res.bytes))} across ${total} ${Str.plural(
    total,
    'document',
    'documents',
  )} in ${String(timer.elapsed)}`;

  table.push([c.gray(Tree.vert)]);
  table.push([c.gray(`${Tree.branch(true)} ${c.italic(completed)}`)]);
  table.push([c.gray(`   ${c.italic(summary)}`)]);
  console.info(String(table));

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
      const formattedId = formatId(e.id);
      warnTable.push([c.gray(`${branch} ${formattedId}`), c.yellow('skipped')]);
    });

    console.info();
    console.info(c.gray(`${c.yellow('Warning')} the following linked documents were not found:`));
    console.info(Str.trimEdgeNewlines(String(warnTable)));
  }
}

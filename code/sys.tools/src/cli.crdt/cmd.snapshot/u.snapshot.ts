import { type t, slug, c, Cli, Rx, Str, Time } from '../common.ts';
import { startRepoWorker } from '../worker/mod.ts';
import { process } from './u.process.ts';

const Tree = Cli.Fmt.Tree;

export async function snapshot(dir: t.StringDir, id: t.StringId) {
  /**
   * Prepare CRDT respository on background worker.
   */
  const spinner = Cli.spinner();
  const repo = await startRepoWorker(dir);
  const evt = repo.events();
  const ready$ = evt.ready$.pipe(Rx.take(1));
  await Rx.firstValueFrom(ready$);
  spinner.stop();

  /**
   * Process snapshot/backup request.
   */
  const table = Cli.table([]);
  const formatId = (id: string) => `crdt:${id.slice(0, -5)}${c.green(id.slice(-5))}`;
  const appendTable = (table: t.CliTable, e: t.CrdtSnapshotProgressSaved) => {
    const coloredId = formatId(e.id);
    const branch = Tree.branch(false);
    const identity = c.gray(`${branch} ${e.isRoot ? c.white(coloredId) : coloredId}`);
    table.push([identity, c.gray(Str.bytes(e.bytes))]);
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
    id,
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
  const completed = `${c.green('completed snapshot')}`;
  const summary = `${c.white(Str.bytes(res.bytes))} across ${total} ${Str.plural(total, 'document', 'documents')} in ${String(timer.elapsed)}`;
  table.push([c.gray(Tree.vert)]);
  table.push([c.gray(`${Tree.branch(true)} ${c.italic(completed)}`)]);
  table.push([c.gray(`   ${c.italic(summary)}`)]);
  console.info(String(table));

  const notFound = progress
    .filter((e) => e.kind === 'doc:skip')
    .filter((e) => e.reason === 'not-found');

  if (notFound.length > 0) {
    const table = Cli.table([]);
    table.push([c.gray(Tree.vert)]);
    notFound.forEach((e, i, total) => {
      const branch = Tree.branch([i, total]);
      const id = formatId(e.id);
      table.push([c.gray(`${branch} ${id}`), c.yellow('skipped')]);
    });
    console.info();
    console.info(c.gray(`${c.yellow('Warning')} the following linked documents were not found:`));
    console.info(Str.trimEdgeNewlines(String(table)));
  }
}

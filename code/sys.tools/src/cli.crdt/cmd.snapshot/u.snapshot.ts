import { type t, c, Cli, Rx, Str, Time } from '../common.ts';
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
  const appendTable = (e: t.CrdtSnapshotProgressSaved) => {
    const coloredId = `crdt:${e.id.slice(0, -5)}${c.green(e.id.slice(-5))}`;
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
      if (e.kind === 'doc:saved') appendTable(e);
      spinner.text = tableText();
    },
  });

  spinner.stop();
  let complete = `${c.green('completed')}`;
  complete += ` - ${c.white(Str.bytes(res.bytes))}`;
  complete += ` in ${String(timer.elapsed)}`;

  table.push([c.gray(Tree.vert)]);
  table.push([c.gray(`${Tree.branch(true)} ${c.italic(complete)}`)]);
  console.info(String(table));
}

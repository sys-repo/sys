import { makeDiscoverRefs } from './cmd.snapshot/mod.ts';
import { type t, c, Cli, Crdt, Is, Obj, Schedule, Str, Yaml } from './common.ts';
import { startRepoOnWorker } from './worker/mod.ts';

type Todo = { todo: string; comment?: string };
type TRef = { doc: t.Crdt.Ref; depth: number; backRefs: number; todos?: Todo[] };

export async function tmp(dir: t.StringDir, id: t.Crdt.Id) {
  const yamlPath = ['slug'];
  const lens = Obj.Lens.at<string>(yamlPath);
  const prettyUri = (id: string) => `${id.slice(0, -5)}${c.green(id.slice(-5))}`;

  /**
   * Retrieve the repo.
   */
  const spinner = Cli.spinner();
  const repo = await startRepoOnWorker(dir, {
    // ws: 'localhost:3030',
    silent: true,
  });
  const cmd = Crdt.Cmd.fromRepo(repo);

  const { doc } = await repo.get(id);
  spinner.stop();

  console.info(c.bold(c.cyan('TEMP 🐷')));
  console.info(`crdt:${c.green(id)}`);
  const refs: TRef[] = [];

  async function flush(sleep = 10_000) {
    spinner.start('flush');
    await Schedule.sleep(sleep);
    spinner.stop();
  }

  async function process(e: t.Crdt.Graph.WalkDocArgs) {
    const { doc, depth } = e;
    const yaml = lens.get(doc.current) ?? '';
    const backRefs = Str.count(yaml, id);
    refs.push({ doc, depth, backRefs });
  }

  async function walk() {
    spinner.start('walking graph');
    await Crdt.Graph.walk({
      id,
      repo,
      discoverRefs: makeDiscoverRefs(yamlPath),
      onDoc: (e) => process(e),
    });

    spinner.stop();
  }
  await walk();

  async function updateRefs(doc?: t.Crdt.Ref) {
    if (!doc) return;
    const ast = Yaml.parseAst(lens.get(doc.current) ?? '');

    Yaml.walk(ast, (e) => {
      if (Yaml.Is.scalar(e.node)) {
        if (e.node.value === 'crdt:foo') {
          console.log(`⚡️💦🐷🌳🦄🐌 🍌🧨🌼✨🧫 🫵 🐚👋🧠⚠️❌ 💥👁️💡─ ↑↓←→✔✅•`);
          e.node.value = 'crdt:bar';
        }
      }
    });

    if (lens.get(doc.current) !== String(ast)) {
      console.log('String(ast)', String(ast));
      doc.change((d) => lens.set(d, String(ast)));
    }

    await flush();
  }

  // await updateRefs(doc);

  async function findTasks(doc?: t.Crdt.Ref) {
    if (!doc) return;
    const ast = Yaml.parseAst(lens.get(doc.current) ?? '');
    const todos: Todo[] = [];

    Yaml.walk(ast, (e) => {
      if (String(e.key).toLowerCase() === 'tasks') {
        console.log('doc:', prettyUri(doc.id));
        const todo = Yaml.toJS(e.node).data;
        if (Is.array(todo)) {
          todo
            .filter((item) => Is.record(item))
            .filter((item) => Is.string(item.TODO))
            .forEach((item) => {
              const todo = Is.string(item.TODO) ? item.TODO : 'Unknown';
              const comment = Is.string(item.comment) ? item.comment : undefined;
              todos.push({ todo, comment });
            });
        }
      }
    });

    return todos;
  }

  for (const item of refs) {
    const todos = await findTasks(item.doc);
    item.todos = todos;
  }
  console.info();
  refs
    .filter((e) => (e.todos ?? []).length > 0)
    .forEach((e) => {
      console.info(prettyUri(e.doc.id));
      const table = Cli.table([]);
      (e.todos ?? []).forEach((item) => {
        table.push([c.green('TODO'), item.todo]);
        if (item.comment) table.push([c.gray('Comment'), c.italic(c.yellow(item.comment))]);
      });

      console.info(String(table));
      console.info();
    });

  /**
   * Print:
   */
  const table = Cli.table([]);
  refs.forEach((e) => {
    const id = prettyUri(e.doc.id);
    const aa = c.gray(`- crdt:${id}`);
    const bb = c.gray(`depth: ${e.depth}`);
    const cc = c.gray(`back-refs: ${e.backRefs}`);
    const dd = c.gray(`todos: ${e.todos?.length ?? 0}`);
    table.push([aa, bb, cc, dd]);
  });

  console.info(String(table));
  console.info(c.gray(`total: ${c.white(String(refs.length))}`));
  console.info();

  // Finish up.
  await repo.dispose();
}

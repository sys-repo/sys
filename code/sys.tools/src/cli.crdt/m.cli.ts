import { type t, Args, c, D, Fs, Is, Prompt } from './common.ts';

import { tmp } from './-u.tmp.ts';
import { RepoProcess } from './cmd.daemon.repo/mod.ts';
import { snapshot } from './cmd.snapshot/mod.ts';
import { startSyncServer, traverseDocumentGraph } from './cmds/mod.ts';
import { getConfig, normalize } from './u.config.ts';
import { Fmt } from './u.fmt.ts';
import { promptAddDocument, promptRemoveDocument } from './u.prompt.ts';
import { CrdtUri } from './u.ts';

type C = t.CrdtCommand;

/**
 * Main entry:
 */
export const cli: t.CrdtToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.toolname;
  const dir = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.CrdtCliArgs>(argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname, dir));

  console.info(await Fmt.header(toolname));
  const res = await run(dir);
  console.info(Fmt.signoff(toolname));

  const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
  if (exit > -1) Deno.exit(exit);
};

/**
 * Execution:
 */

async function run(dir: t.StringDir): Promise<t.RunReturn> {
  const config = await getConfig(dir);
  await normalize(config);

  const done = (exit: number | boolean = false): t.RunReturn => ({ exit });

  const listing = (config.current.docs ?? [])
    .map((doc) => ({ doc, name: doc.name ?? '', value: `crdt:${doc.id}` }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e, i, total) => {
      const { doc } = e;
      const branch = Fmt.Tree.branch([i, total]);
      const id = `crdt:${doc.id.slice(0, 5)}..${c.green(doc.id.slice(-5))}`;
      let name = `${' with:'} ${branch} ${id}`;
      if (doc.name) name += `  •  ${doc.name}`;
      return { name, value: e.value };
    });

  /** --------------------------------------------------------
   * Root Menu
   */
  {
    console.info();
    const A = (await Prompt.Select.prompt<C>({
      message: 'Option:\n',
      options: [
        { name: '  add: <document>', value: 'doc:add' satisfies C },
        ...listing,
        { name: ' start: sync server (websockets)', value: 'sync-server:start' satisfies C },
        { name: ' start: repository daemon', value: 'repo:daemon:start' satisfies C },
        { name: c.gray('(quit)'), value: 'quit' },
      ],
    })) as C;

    let id = CrdtUri.hasPrefix(A) ? CrdtUri.trimPrefix(A) : '';
    if (A === 'doc:add') {
      const res = await promptAddDocument(dir);
      if (!res?.id) return done();
      id = res.id;
    }

    if (A === 'quit') return done(0);

    /** --------------------------------------------------------
     * Document Menu
     */
    {
      if (A.startsWith('crdt:')) {
        const B = (await Prompt.Select.prompt<t.CrdtCommand>({
          message: `with ${c.gray(`crdt:${id.slice(0, -5)}${c.green(id.slice(-5))}`)}:`,
          options: [
            { name: '  Snapshot', value: 'snapshot' },
            { name: '  Ref Graph → Stats', value: 'doc:info-graph' },
            { name: '  Yaml Viewer', value: 'doc:viewer:yaml' },
            { name: '  Print Config', value: 'doc:config:print' },
            // { name: ' Filter Tasks', value: 'filter:tasks' },
            // { name: '  🐷', value: 'tmp:🐷' },
            { name: c.gray(c.dim(' (forget)')), value: 'doc:remove' },
          ],
        })) as t.CrdtCommand;

        if (B === 'snapshot') {
          await snapshot(dir, id);
          return done(0);
        }

        if (B === 'doc:info-graph') {
          await traverseDocumentGraph(id);
          return done(0);
        }

        if (B === 'doc:viewer:yaml') {
          const m = await import('./cmds/cmd.yaml-viewer.ts');
          const path = ['slug']; // TEMP 🐷
          await m.startYamlViewer(dir, id, path);
          return done(0);
        }

        if (B === 'doc:config:print') {
          console.info(Fmt.printDocConfig(config.current, id));
          return done(0);
        }

        if (B === 'doc:remove') {
          await promptRemoveDocument(dir, id);
          return done(0);
        }

        if (B === 'tmp:🐷') {
          await tmp(dir, id);
          return done(0);
        }

        if (B === 'quit') return done(0);
      }
    }

    /** --------------------------------------------------------
     * Daemons/Services
     */
    {
      if (A === 'repo:daemon:start') {
        await RepoProcess.daemon(dir);
      }

      if (A === 'sync-server:start') {
        await startSyncServer(dir);
      }
    }
  }

  // End.
  return done(0);
}

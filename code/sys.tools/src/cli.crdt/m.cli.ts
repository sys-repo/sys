import { type t, Args, c, D, Fs, getConfig, Is, Prompt } from './common.ts';

import { tmp } from './-u.tmp.ts';
import { snapshot } from './cmd.snapshot/mod.ts';
import { SyncTools } from './cmd.sync/mod.ts';
import { findTasks } from './cmd.tasks/mod.ts';
import { normalize } from './u.config.doc.ts';
import { Fmt } from './u.fmt.ts';
import { promptAddDocument, promptRemoveDocument } from './u.prompt.ts';
import { CrdtUri } from './u.ts';

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

  const listing = (config.current.docs ?? []).map((doc, i, total) => {
    const branch = Fmt.Tree.branch([i, total]);
    const id = `crdt:${doc.id.slice(0, 5)}..${c.green(doc.id.slice(-5))}`;
    let name = `${' with:'} ${branch} ${id}`;
    if (doc.name) name += `  •  ${doc.name}`;
    return {
      name,
      value: `crdt:${doc.id}`,
    };
  });

  /** --------------------------------------------------------
   * Root Menu
   */
  let id: t.Crdt.Id | undefined;
  {
    console.info();
    const A = (await Prompt.Select.prompt<t.CrdtCommand>({
      message: 'Choose:\n',
      options: [
        { name: '  add: <document>', value: 'modify:add' },
        ...listing,
        { name: ' Sync Tools', value: 'sync' },
        { name: c.gray('(quit)'), value: 'quit' },
      ],
    })) as t.CrdtCommand;

    let id = CrdtUri.hasPrefix(A) ? CrdtUri.trimPrefix(A) : '';
    if (A === 'modify:add') {
      const res = await promptAddDocument(dir);
      if (!res?.id) return done();
      id = res.id;
    }

    // if (!id) return done(0);
    if (A === 'quit') return done(0);

    /** --------------------------------------------------------
     * Document Menu
     */
    {
      if (A.startsWith('crdt:')) {
        const B = (await Prompt.Select.prompt<t.CrdtCommand>({
          message: `with ${c.gray(`crdt:${id.slice(0, -5)}${c.green(id.slice(-5))}`)}:`,
          options: [
            { name: ' 🐷', value: 'tmp:🐷' },
            { name: ' Backup (Snapshot)', value: 'snapshot' },
            { name: ' Filter Tasks', value: 'filter:tasks' },
            { name: '(forget)', value: 'modify:remove' },
          ],
        })) as t.CrdtCommand;

        if (B === 'snapshot') {
          await snapshot(dir, id);
          return done(0);
        }

        if (B === 'filter:tasks') {
          findTasks(dir, id);
          return done(0);
        }

        if (B === 'modify:remove') {
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
     * Sync
     */
    {
      if (A === 'sync') {
        console.log(`⚡️💦🐷🌳🦄🐌 🍌🧨🌼✨🧫 🫵 🐚👋🧠⚠️❌ 💥👁️💡─ ↑↓←→✔✅•`);
        await SyncTools.start(dir);
      }
    }
  }

  // End
  return done(0);
}

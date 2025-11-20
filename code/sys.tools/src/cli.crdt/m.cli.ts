import { snapshot } from './cmd.snapshot/mod.ts';
import { type t, Args, c, D, Fs, getConfig, Is, Prompt } from './common.ts';
import { normalize } from './u.config.doc.ts';
import { Fmt } from './u.fmt.ts';
import { promptAddDocument, promptRemoveDocument } from './u.prompt.modify.ts';
import { CrdtUri } from './u.ts';

type RunReturn = { exit: number | boolean };

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
  console.info();
  console.info(Fmt.signoff(toolname));

  const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
  if (exit > -1) Deno.exit(exit);
};

/**
 * Execution:
 */

async function run(dir: t.StringDir): Promise<RunReturn> {
  const config = await getConfig(dir);
  await normalize(config);

  const done = (exit: number | boolean = false): RunReturn => ({ exit });

  const listing = (config.current.docs ?? []).map((doc, i, total) => {
    const branch = Fmt.Tree.branch([i, total]);
    const id = `crdt:${doc.id.slice(0, 5)}..${c.green(doc.id.slice(-5))}`;
    let name = `${'with:'} ${branch} ${id}`;
    if (doc.name) name += `  •  ${doc.name}`;
    return {
      name,
      value: `crdt:${doc.id}`,
    };
  });

  console.info();
  const optionA = (await Prompt.Select.prompt<t.CrdtCommand>({
    message: 'Choose:\n',
    options: [{ name: ' add: <document>', value: 'modify:add' }, ...listing],
  })) as t.CrdtCommand;

  let id = CrdtUri.hasPrefix(optionA) ? CrdtUri.trimPrefix(optionA) : '';
  if (optionA === 'modify:add') {
    const res = await promptAddDocument(dir);
    if (!res?.id) return done();
    id = res.id;
  }
  if (!id) return done();

  const optionB = (await Prompt.Select.prompt<t.CrdtCommand>({
    message: `with ${c.gray(`crdt:${id.slice(0, -5)}${c.green(id.slice(-5))}`)}:`,
    options: [
      { name: 'Backup (Snapshot)', value: 'snapshot' },
      { name: 'Forget', value: 'modify:remove' },
    ],
  })) as t.CrdtCommand;

  if (optionB === 'modify:remove') {
    await promptRemoveDocument(dir, id);
    return done();
  }

  if (optionB === 'snapshot') {
    await snapshot(dir, id);
    return done(0);
  }

  return done();
}

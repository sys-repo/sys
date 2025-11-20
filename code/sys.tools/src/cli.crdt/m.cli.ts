import { snapshot } from './cmd.snapshot/mod.ts';
import { type t, Args, c, D, Fs, getConfig, Prompt, Str } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { promptRemoveDocument, promptAddDocument } from './u.prompt.modify.ts';
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
  await run(dir);
  console.info();
  console.info(Fmt.signoff(toolname));
};

/**
 * Execution:
 */
async function run(dir: t.StringDir) {
  const config = await getConfig(dir);

  const listing = (config.current.docs ?? []).map((doc, i, docs) => {
    const isLast = i === docs.length - 1;
    const prefix = isLast ? '└─' : '├─';
    const id = `crdt:${doc.id.slice(0, 5)}..${c.green(doc.id.slice(-5))}`;

    let name = `${'with:'} ${c.gray(prefix)} ${id}`;
    if (doc.name) name += `  •  ${doc.name}`;

    return {
      name,
      value: `crdt:${doc.id}`,
    };
  });

  console.info();
  const optionA = (await Prompt.Select.prompt<t.CrdtCommand>({
    message: 'Choose:\n',
    options: [{ name: 'Add <document>', value: 'modify:add' }, ...listing],
  })) as t.CrdtCommand;

  let id = CrdtUri.hasPrefix(optionA) ? CrdtUri.trimPrefix(optionA) : '';
  if (optionA === 'modify:add') {
    const res = await promptAddDocument(dir);
    if (!res?.id) return;
    id = res.id;
  }
  if (!id) return;

  const optionB = (await Prompt.Select.prompt<t.CrdtCommand>({
    message: `with ${c.gray(`crdt:${id.slice(0, -5)}${c.green(id.slice(-5))}`)}:`,
    options: [
      { name: 'Backup (Snapshot)', value: 'snapshot' },
      { name: 'Forget', value: 'modify:remove' },
    ],
  })) as t.CrdtCommand;

  if (optionB === 'modify:remove') {
    await promptRemoveDocument(dir, id);
    return;
  }

  if (optionB === 'snapshot') {
    await snapshot(dir, id);
  }
}

import { Args, c, Cli } from '@sys/cli';
import { Fs } from '@sys/fs';
import { rx, Str } from '@sys/std';

const { italic: i } = c;

type TArgs = { watch?: boolean };
const args = Args.parse<TArgs>(Deno.args, { boolean: ['watch'], alias: { w: 'watch' } });
console.info(c.cyan('args:'), args);

let copyCount = 0;

/**
 * Copy the SLC project content to the VitePress (driver) development sample directory
 * from it's external content authoring location.
 */
const dir = {
  source: '/Users/phil/Documents/Notes/tdb/slc/slc-public',
  target: Fs.resolve('code/sys.driver/driver-vitepress/.tmp/sample'),
} as const;

export async function copyDocs() {
  const Fmt = {
    path: (path: string) => `${c.gray(Fs.dirname(path))}/${c.white(Fs.basename(path))}`,
  } as const;

  copyCount++;

  const title = c.bold(c.brightGreen('Copy'));
  const table = Cli.table([title]);
  const push = (label: string, value: string) => table.push([c.gray(label), value]);
  const blankLine = () => table.push([]);

  const copy = async (from: string, to: string) => {
    from = Fs.join(dir.source, from);
    to = Fs.join(dir.target, to);
    await Fs.copy(from, to, { force: true });
    push(` • from`, c.gray(Fs.trimCwd(from)));
    push(` • ${c.cyan('to')}`, Fmt.path(Fs.trimCwd(to)));
    blankLine();
  };

  blankLine();
  await copy('docs', 'docs');
  await copy('src', 'src');

  // Ouput.
  console.info();
  console.info(table.toString().trim());
  console.info();
  console.info(i(`copied ${c.green(String(copyCount))} ${Str.plural(copyCount, 'time', 'times')}`));
}

await copyDocs();

/**
 * Watcher.
 */
if (args.watch) {
  const watcher = await Fs.watch(dir.source);
  watcher.$.pipe(rx.debounceTime(1000)).subscribe(copyDocs);
  console.info();
  console.info(i(c.gray(`  (watching for file changes)`)));
  console.info(i(c.gray(`  ${c.yellow('Enter')} to force copy`)));
  console.info();

  for await (const e of Cli.keypress()) {
    if (e.key === 'return') copyDocs();
    if ((e.ctrlKey && e.key === 'c') || e.key === 'q') Deno.exit(0);
  }
}

// Finish up.
if (!args.watch) {
  const y = c.yellow;
  console.info(c.italic(c.gray(`(pass ${y('--watch')} (${y('-w')}) to re-run on file changes)`)));
  console.info();
  Deno.exit(0);
}

import { rx } from '@sys/std';
import { c, Cli, Args } from '@sys/cli';
import { Fs } from '@sys/fs';

type TArgs = { watch?: boolean };
const args = Args.parse<TArgs>(Deno.args, { alias: { w: 'watch' } });
console.log('args', args);

/**
 * Copy the SLC project content to the VitePress (driver) development sample directory
 * from it's external content authoring location.
 */
const dir = {
  source: '/Users/phil/Documents/Notes/tdb/slc/current',
  target: Fs.resolve('code/sys.driver/driver-vitepress/.tmp/sample'),
} as const;

export async function copyDocs() {
  const formatPath = (path: string) => `${c.gray(Fs.dirname(path))}/${c.white(Fs.basename(path))}`;

  const table = Cli.table([]);
  const push = (label: string, value: string) => table.push([c.gray(label), value]);

  const copy = async (from: string, to: string) => {
    from = Fs.join(dir.source, from);
    to = Fs.join(dir.target, to);
    await Fs.copy(from, to, { force: true });
    push('From', formatPath(Fs.trimCwd(from)));
    push('To', formatPath(Fs.trimCwd(to)));
    table.push([]);
  };

  await copy('docs', 'docs');
  await copy('src', 'src');

  // Ouput
  console.info();
  console.info(c.bold(c.brightGreen('Copy')));
  console.info(table.toString().trim());
  console.info();
}

/**
 * Watcher.
 */
if (args.watch) {
  const watcher = await Fs.watch(dir.source);
  watcher.$.pipe(rx.debounceTime(500)).subscribe(copyDocs);
  console.info(c.italic(c.brightCyan(`\n(watching for file changes)`)));
}

/**
 * Initial Run
 */
await copyDocs();
if (!args.watch) Deno.exit(0);

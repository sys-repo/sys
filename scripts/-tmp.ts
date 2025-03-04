import { c, Cli } from '@sys/cli';
import { Fs } from '@sys/fs';

export async function copyDocs() {
  const dir = {
    source: '/Users/phil/Documents/Notes/tdb/slc/current',
    target: Fs.resolve('code/sys.driver/driver-vitepress/.tmp/sample'),
  } as const;

  const table = Cli.table([]);
  const push = (label: string, value: string) => table.push([c.gray(label), value]);

  const copy = async (from: string, to: string) => {
    from = Fs.join(dir.source, from);
    to = Fs.join(dir.target, to);
    await Fs.copy(from, to, { force: true });
    push('From', from);
    push('To', to);
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
 * Run
 */
await copyDocs();
Deno.exit(0);

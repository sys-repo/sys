import { Fs, Cli, c } from '@sys/std-s';

// TEMP 🐷
const root = '/Users/phil/code/org.cellplatform/platform-0.2.0/code/spikes/dev.000';
const from = Fs.join(root, 'dist/web');
const to = Fs.resolve('./dist');

const exists = {
  from: await Fs.exists(from),
  to: await Fs.exists(to),
};

const table = Cli.table(['', 'exists', 'path']);
table.push([c.green('From'), String(exists.from), c.gray(from)]);
table.push([c.green('To'), String(exists.to), c.gray(to)]);

console.info();
console.info(c.gray(table.toString()));

await Fs.removeDir(to);
await Fs.copyDir(from, to);
console.info();

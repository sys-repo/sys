import { c, Cli, Fs } from './common.ts';

const targets = [
  '.pi/@sys/dist/@sys.driver-pi',
  '.pi/@sys/dist/@sys/driver-pi',
] as const;
const root = Fs.resolve(import.meta.dirname ?? '.', '../../../..');
const table = Cli.table();

for (const target of targets) {
  const deleted = await Fs.remove(Fs.join(root, target));
  const status = deleted ? c.green('deleted') : c.italic(c.gray('already absent'));
  table.push([c.cyan('delete'), c.gray(target), status]);
}

console.info();
console.info(c.bold('Dist Reset (GUI)'));
console.info(table.toString().trim());
console.info();

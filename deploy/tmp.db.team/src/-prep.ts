import { Cli, Fs, c } from '@sys/std-s';

/**
 * TODO 🐷 - tidy up script and find a home for the behavior.
 */
const PATHS = {
  // dev000: `/Users/phil/code/org.cellplatform/platform-0.2.0/code/spikes/dev.000`,
  devHarness: Fs.Path.resolve('../../code/sys.ui/ui-dev-harness/dist'),
  viteDriver: Fs.Path.resolve('../../code/sys.driver/driver-vite/dist'),
};

// const from = PATHS.dev000;
const from = PATHS.devHarness;
// const from = PATHS.viteDriver;
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

import { Cli, c } from '@sys/cli';
import { Fs } from '@sys/fs';

/**
 * TODO 🐷 - tidy up script and find a home for the behavior.
 */
const PATHS = {
  // dev000: `/Users/phil/code/org.cellplatform/platform-0.2.0/code/spikes/dev.000`,
  DEV_HARNESS: Fs.Path.resolve('../../code/sys.ui/ui-react-devharness/dist'),
  DRIVER_VITE: Fs.Path.resolve('../../code/sys.driver/driver-vite/dist'),
};

// const from = PATHS.dev000;
// const from = PATHS.viteDriver;
const from = PATHS.DEV_HARNESS;
const to = Fs.resolve('./dist');

const exists = {
  from: await Fs.exists(from),
  to: await Fs.exists(to),
  label(exists: boolean) {
    return exists ? 'exists' : c.yellow('404');
  },
};

const table = Cli.table([]);
table.push([c.green('From'), exists.label(exists.from), c.gray(from)]);
table.push([c.green('To'), exists.label(exists.to), c.gray(to)]);

console.info();
console.info(c.gray(table.toString()));

await Fs.copy(from, to, { force: true, throw: true });
console.info();

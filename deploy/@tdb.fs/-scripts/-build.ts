import { buildAndCopyAll, copyPublic } from './-build.u.ts';
import { Fs, pkg, Pkg, Tmpl } from './common.ts';

await Fs.remove('dist');

/**
 * Pull in modules:
 */
console.info();
const build = true;

await buildAndCopyAll([
  ['../../code/sys.ui/ui-react-components', 'sys/ui', { build }],
  ['../../code/sys.driver/driver-monaco', 'sys/driver.monaco', { build }],
  ['../../code/sys.driver/driver-automerge', 'sys/driver.automerge', { build }],
  ['../../code/sys.driver/driver-peerjs', 'sys/driver.peerjs', { build }],
]);
await copyPublic('public', 'dist');

// Write entry HTML.
const tmpl = Tmpl.create('src/-tmpl');
await tmpl.write('dist');

/**
 * Calculate [PkgDist].
 */
await Fs.remove('dist/dist.json');
await Pkg.Dist.compute({ dir: 'dist', pkg, save: true, builder: pkg });

// Finish.
Deno.exit(0);

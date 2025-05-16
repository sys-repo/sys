import { buildAndCopy } from './-build.u.ts';
import { Fs, pkg, Pkg, Tmpl } from './common.ts';

/**
 * Ensure dist.
 */
await Fs.ensureDir('./dist');

/**
 * Pull in modules.
 */
console.info();
const build = true;
await buildAndCopy('../../code/sys.ui/ui-react-components', 'sys/ui', { build });
await buildAndCopy('../../code/sys.driver/driver-monaco', 'sys/ui.driver.monaco', { build });

// Write entry HTML.
const tmpl = Tmpl.create('src/-tmpl');
await tmpl.write('dist');

/**
 * Calculate [PkgDist].
 */
await Fs.remove('dist/dist.json');
const computed = await Pkg.Dist.compute({ dir: 'dist', pkg, save: true, builder: pkg });
Pkg.Dist.log(computed.dist, { dir: 'dist' });
console.info();

// Finish.
Deno.exit(0);

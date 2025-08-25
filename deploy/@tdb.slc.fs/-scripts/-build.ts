import { Fs, pkg, Pkg, Tmpl } from './common.ts';

/**
 * Pull in modules:
 */
console.info();
await Fs.copy('public/video', 'dist/video');

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

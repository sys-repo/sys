import { c, Fs, pkg, Pkg, TmplEngine } from './common.ts';

/**
 * Pull in modules:
 */
console.info();
await Fs.remove('dist', { log: true });
await Fs.copy('public/video', 'dist/video');
await Fs.copy('public/video.v2', 'dist/video.v2');

// Write entry HTML.
const tmpl = TmplEngine.makeTmpl('src/-tmpl', async (e) => {
  const filepath = e.target.relative;
});

await tmpl.write('dist');

/**
 * Calculate [PkgDist].
 */
await Fs.remove('dist/dist.json');
await Pkg.Dist.compute({ dir: 'dist', pkg, save: true, builder: pkg });

// Finish.
Deno.exit(0);

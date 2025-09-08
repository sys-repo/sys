import { buildAndCopyAll, copyPublic } from './-build.u.ts';
import { Fs, pkg, Pkg, TmplEngine } from './common.ts';

await Fs.remove('./dist');

/**
 * Pull in modules:
 */
console.info();
const build = true;

await buildAndCopyAll([
  ['../../code/sys.ui/ui-react-components', 'sys/ui.components', { build }],
  ['../../code/sys.ui/ui-factory', 'sys/ui.factory', { build }],
  ['../../code/sys.driver/driver-automerge', 'sys/driver.automerge', { build }],
  ['../../code/sys.driver/driver-monaco', 'sys/driver.monaco', { build }],
  ['../../code/sys.driver/driver-peerjs', 'sys/driver.peerjs', { build }],
  ['../../code/sys.driver/driver-prosemirror', 'sys/driver.prosemirror', { build }],
  ['../../code/sys.dev', 'sys/dev', { build }],
]);
await copyPublic('public', 'dist');

// Write entry HTML.
const tmpl = TmplEngine.makeTmpl('src/-tmpl');
await tmpl.write('dist');

/**
 * Calculate [PkgDist].
 */
await Fs.remove('dist/dist.json');
const dist = (await Pkg.Dist.compute({ dir: 'dist', pkg, save: true, builder: pkg })).dist;

// Write version-hash into root HTML.
await TmplEngine.File.update(Fs.join('dist/index.html'), (line) => {
  if (line.text.includes('<a href="./dist.json">')) {
    const hash = dist.hash.digest ?? '00000';
    const hx = `#${hash.slice(-5)}`;
    line.modify(line.text.replace(/dist.json\<\/a>/, `dist.json (${hx})</a>`));
  }
});

// Finish.
Deno.exit(0);

import { Vite } from '@sys/driver-vite';
import { c, Fmt, Fs, Pkg, pkg, ROOT, type t } from './common.ts';
import { DIST_LIMITS, selectionFiles } from '../src/m.app/u.selection.ts';

/** Build and verify the UI, then explicitly select its exact manifest bytes. */
const build = await Vite.build({ cwd: ROOT, pkg, exitOnError: false });
if (!build.ok) throw new Error('Sample UI build failed.');

const verified = await Pkg.Dist.Local.verify({
  dir: Fs.join(ROOT, 'dist'),
  limits: DIST_LIMITS,
});
if (verified.kind !== 'verified') throw new Error(`Sample Dist refused: ${verified.kind}.`);
const files = selectionFiles(verified.evidence.dist);
const pin: t.DistPin = { 'dist.json': verified.evidence.integrity };
const pinPath = Fs.join(ROOT, 'dist.pin.json');
await Fs.writeJson(pinPath, pin, { throw: true });

const pinLink = Fmt.hyperlink(
  c.gray('dist.pin.json'),
  Fs.Path.toFileUrl(pinPath),
  { underline: true },
);
console.info(build.toString());
console.info();
console.info(`Admitted ${files.length} files`);
console.info(`${c.gray(Fmt.Tree.branch(true))} manifest checksum ${c.gray(`(${pinLink})`)}`);
console.info(`   ${c.gray(pin['dist.json'])}`);

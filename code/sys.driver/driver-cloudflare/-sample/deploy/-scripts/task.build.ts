import { Vite } from '@sys/driver-vite';
import { Fs, Obj, Pkg, pkg, ROOT } from './common.ts';
import { artifactFrom, DIST_LIMITS } from '../src/u.selection.ts';

const build = await Vite.build({ cwd: ROOT, pkg, exitOnError: false });
if (!build.ok) throw new Error('Sample UI build failed.');

const verified = await Pkg.Dist.Local.verify({
  dir: Fs.join(ROOT, 'dist'),
  limits: DIST_LIMITS,
});
if (verified.kind !== 'verified') throw new Error(`Sample Dist refused: ${verified.kind}.`);

const artifact = artifactFrom({
  integrity: verified.evidence.integrity,
  files: [...Obj.keys(verified.evidence.dist.hash.parts), 'dist.json'].sort(),
});

await Fs.writeJson(Fs.join(ROOT, 'artifact.json'), {
  integrity: artifact.integrity,
  files: [...artifact.files],
}, { throw: true });

console.info(build.toString());
console.info(`Admitted ${artifact.files.length} files; ${artifact.integrity}`);

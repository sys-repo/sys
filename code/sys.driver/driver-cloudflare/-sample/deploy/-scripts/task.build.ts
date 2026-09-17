import { c, Fmt } from '@sys/cli/fmt';
import { Vite } from '@sys/driver-vite';
import { Fs, Obj, Pkg, pkg, ROOT } from './common.ts';
import { artifactFrom, DIST_LIMITS } from '../src/m.app/u.selection.ts';

/**
 * Build the sample UI, verify the Dist, and record the selected artifact.
 */
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

const artifactPath = Fs.join(ROOT, 'artifact.json');
await Fs.writeJson(artifactPath, {
  integrity: artifact.integrity,
  files: [...artifact.files],
}, { throw: true });

const artifactLink = Fmt.hyperlink(
  c.gray('artifact.json:integrity'),
  Fs.Path.toFileUrl(artifactPath),
  { underline: true },
);
console.info(build.toString());
console.info();
console.info(`Admitted ${artifact.files.length} files`);
console.info(`${c.gray(Fmt.Tree.branch(true))} manifest checksum ${c.gray(`(${artifactLink})`)}`);
console.info(`   ${c.gray(artifact.integrity)}`);

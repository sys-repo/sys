import { Vite } from '@sys/driver-vite';
import { c, Fmt, Fs, Pkg, pkg, ROOT } from './common.ts';
import { artifactFrom, DIST_LIMITS } from '../src/m.app/u.selection.ts';
import { selectionFiles } from './u.selection.ts';

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
  files: selectionFiles(verified.evidence.dist),
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

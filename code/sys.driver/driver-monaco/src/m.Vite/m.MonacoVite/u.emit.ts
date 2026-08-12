import { Fs, Hash, Obj, Str, Time } from './common.ts';
import { NOTICE_FILES, PACKAGE_NAME } from './u.constants.ts';
import type { GetSource, Source } from './t.ts';
import { fail } from './u.error.ts';
import { hashDir, hashPartsEqual } from './u.hash.ts';
import { inspectTree, readRegularFile } from './u.tree.ts';

export async function emitAssets(getSource: GetSource, target: string) {
  const timer = Time.timer();
  const source = await getSource();

  await Fs.copyDir(source.runtimeDir, target, { throw: true });
  for (const filename of NOTICE_FILES) {
    const path = Fs.join(target, filename);
    const result = await Fs.write(path, source.notices[filename], { throw: true });
    if (result.error) fail(`Could not emit required notice: ${path}.`);
  }
  await verifyOutput(source, target);

  const files = Obj.keys(source.hash.parts).length;
  const size = Str.bytes(source.bytes);
  console.info(
    `Verified ${PACKAGE_NAME}@${source.version}: ` +
      `${files} runtime files, ${size}, notices intact (${timer.elapsed.msec}ms).`,
  );
}

async function verifyOutput(source: Source, target: string) {
  await inspectTree(target);

  const notices = new Set(NOTICE_FILES.map((filename) => Fs.join(target, filename)));
  const outputHash = await hashDir(target, (path) => !notices.has(path));
  if (!hashPartsEqual(source.hash.parts, outputHash.parts)) {
    fail(
      `Generated ${target} path-to-hash map differs from ${source.runtimeDir} ` +
        `(source ${source.hash.digest || 'empty'}, output ${outputHash.digest || 'empty'}).`,
    );
  }

  for (const filename of NOTICE_FILES) {
    const outputNotice = await readRegularFile(Fs.join(target, filename));
    if (Hash.sha256(source.notices[filename]) !== Hash.sha256(outputNotice)) {
      fail(`Generated notice differs from its ${PACKAGE_NAME} source: ${filename}.`);
    }
  }
}

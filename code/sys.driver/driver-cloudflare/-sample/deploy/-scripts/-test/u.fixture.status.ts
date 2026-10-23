import { fixtureInputs } from '../../src/-test/u.fixture.ts';
import { BUILD_RECORD_FILENAME, DIST_LIMITS } from '../../src/m.deployment/mod.ts';
import { Fs, Pkg, type t } from './common.ts';

/** Only private output is needed to prove local shell presentation. */
export async function shellFixture() {
  const temp = await Fs.makeTempDir({ prefix: 'sample-r2-status-' });
  try {
    const dir = Fs.toDir(await Fs.realPath(temp.absolute));
    const output = dir.join('dist.private');
    await Fs.write(Fs.join(output, 'index.html'), 'fixture', { throw: true });
    const computed = await Pkg.Dist.compute({
      dir: output,
      pkg: { name: '@test/r2', version: '0.0.0' },
      save: true,
    });
    if (computed.kind !== 'computed') throw new Error(computed.error.message);
    const pin = computed.pin;
    const verified = await Pkg.Dist.Pinned.verify({ dir: output, pin, limits: DIST_LIMITS });
    if (verified.kind !== 'verified') throw new Error(`Fixture Dist refused: ${verified.kind}.`);
    const base = fixtureInputs();
    // Only the private pin refers to local output; no public build or provider access is needed.
    const inputs: t.AppInputs = {
      config: base.config,
      buildRecord: {
        publicAssetBase: base.buildRecord.publicAssetBase,
        bundleSize: base.buildRecord.bundleSize,
        selection: { pins: { ...base.buildRecord.selection.pins, private: pin } },
      },
    };
    await Fs.writeJson(dir.join('r2.config.json'), inputs.config, { throw: true });
    await Fs.writeJson(dir.join(BUILD_RECORD_FILENAME), inputs.buildRecord, { throw: true });
    return {
      dir,
      pin,
      inputs,
      digest: verified.evidence.content.digest,
      manifestChecksum: verified.evidence.manifestChecksum,
      async [Symbol.asyncDispose]() {
        await Fs.remove(dir.absolute);
      },
    };
  } catch (error) {
    await Fs.remove(temp.absolute);
    throw error;
  }
}

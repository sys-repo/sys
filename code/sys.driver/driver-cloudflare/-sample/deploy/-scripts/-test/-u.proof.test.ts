import { prepareProof } from '../u.proof.ts';
import { DIST_LIMITS, LIMITS } from '../../src/m.app/u.selection.ts';
import { describe, expect, expectError, Fs, it, Obj, Pkg } from './common.ts';

/** Offline candidate selection only: no credentials, listener, or live R2 requests. */
describe('R2 deployment sample: proof selection', () => {
  it('new build → new pin and file selection, without changing the previous run', async () => {
    await using f = await fixture();
    const first = await prepareProof(f.dir.absolute);
    const rebuilt = await f.build('second', true);
    const second = await prepareProof(f.dir.absolute);

    expect(first.config).to.eql(f.config);
    expect(first.artifact.integrity).to.eql(f.artifact.integrity);
    expect(second.artifact).to.eql(rebuilt);
    expect(second.artifact.integrity).not.to.eql(first.artifact.integrity);
    expect(first.expected.size).to.eql(2);
    expect(second.expected.size).to.eql(3);
    expect(new TextDecoder().decode(first.expected.get('index.html'))).to.eql('first');
    expect(new TextDecoder().decode(second.expected.get('index.html'))).to.eql('second');
    expect((await first.verify()).kind).to.eql('integrity-mismatch');
    expect((await second.verify()).kind).to.eql('verified');
  });

  it('later artifact edits → rechecks retain the original manifest pin and selection', async () => {
    await using f = await fixture();
    const selected = await prepareProof(f.dir.absolute);
    await Fs.writeJson(f.dir.join('artifact.json'), {
      integrity: `sha256-${'0'.repeat(64)}`,
      files: [...f.artifact.files, 'later.js'],
    }, { throw: true });

    expect((await selected.verify()).kind).to.eql('verified');
    expect(selected.artifact).to.eql(f.artifact);
    expect([...selected.expected.keys()].sort()).to.eql(['dist.json', 'index.html']);
  });

  it('rebuilt Dist with the old artifact pin → refusal, not automatic repinning', async () => {
    await using f = await fixture();
    await f.build('second');
    await Fs.writeJson(f.dir.join('artifact.json'), f.artifact, { throw: true });
    await expectError(
      () => prepareProof(f.dir.absolute),
      'Local Dist refused: integrity-mismatch.',
    );
  });

  it('changed asset bytes → refusal before live work', async () => {
    await using f = await fixture();
    await Fs.write(f.dir.join('dist/index.html'), 'changed', { throw: true });
    await expectError(() => prepareProof(f.dir.absolute), 'Local Dist refused: content-mismatch.');
  });

  it('artifact filename drift → refusal before live work', async () => {
    await using f = await fixture();
    await Fs.writeJson(f.dir.join('artifact.json'), {
      ...f.artifact,
      files: [...f.artifact.files, 'not-in-build.js'],
    }, { throw: true });
    await expectError(
      () => prepareProof(f.dir.absolute),
      'Artifact filename selection differs from the verified Dist.',
    );
  });
});

async function fixture() {
  const temp = await Fs.makeTempDir({ prefix: 'sample-r2-proof-' });
  try {
    const dir = Fs.toDir(await Fs.realPath(temp.absolute));
    const config = {
      accountId: '1'.repeat(32),
      bucket: 'fixture-bucket',
      prefix: 'fixture/ui',
      credentials: {
        accessKeyId: 'PROOF_FIXTURE_ACCESS_KEY_ID',
        secretAccessKey: 'PROOF_FIXTURE_SECRET_ACCESS_KEY',
      },
      limits: LIMITS,
    };
    await Fs.writeJson(dir.join('config.json'), config, { throw: true });

    const build = async (html: string, extra = false) => {
      await Fs.write(dir.join('dist/index.html'), html, { throw: true });
      if (extra) await Fs.write(dir.join('dist/app.js'), 'export {};', { throw: true });
      await Pkg.Dist.compute({
        dir: dir.join('dist'),
        pkg: { name: '@test/r2', version: '0.0.0' },
        save: true,
      });
      const verified = await Pkg.Dist.Local.verify({ dir: dir.join('dist'), limits: DIST_LIMITS });
      if (verified.kind !== 'verified') throw new Error(`Fixture Dist refused: ${verified.kind}.`);
      const artifact = {
        integrity: verified.evidence.integrity,
        files: [...Obj.keys(verified.evidence.dist.hash.parts), 'dist.json'].sort(),
      };
      await Fs.writeJson(dir.join('artifact.json'), artifact, { throw: true });
      return artifact;
    };
    const artifact = await build('first');
    return {
      dir,
      config,
      artifact,
      build,
      async [Symbol.asyncDispose]() {
        await Fs.remove(dir.absolute);
      },
    };
  } catch (error) {
    await Fs.remove(temp.absolute);
    throw error;
  }
}

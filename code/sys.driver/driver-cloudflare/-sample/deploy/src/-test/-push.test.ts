import type { DeployTool } from '@sys/tools/deploy';
import { Yaml } from '@sys/yaml';
import { describe, expect, expectError, Fs, it, Obj, Pkg, type t } from '../-test.ts';
import { pushSample } from '../../-scripts/task.push.ts';
import { DIST_LIMITS, LIMITS } from '../u.selection.ts';

const config: t.Config = {
  accountId: '1'.repeat(32),
  bucket: 'fixture-bucket',
  prefix: 'fixture/ui',
  credentials: {
    accessKeyId: 'PUSH_FIXTURE_ACCESS_KEY_ID',
    secretAccessKey: 'PUSH_FIXTURE_SECRET_ACCESS_KEY',
  },
  limits: LIMITS,
};

describe('R2 deployment sample: push', () => {
  it('hands the verified existing Dist to the uploader with credential references only', async () => {
    await using f = await fixture();
    const before = await Fs.readText(f.dir.join('dist/dist.json'));
    const result = await pushSample(f.dir.absolute, f.publish);
    const path = f.dir.join('.tmp/push.yaml');
    expect(result.targets).to.eql(1);
    expect(f.calls).to.eql([{ cwd: f.dir.absolute, config: path }]);
    const generated = Yaml.parse((await Fs.readText(path)).data);
    expect(generated.error).to.eql(undefined);
    expect(generated.data).to.eql({
      provider: {
        kind: 'r2',
        accountId: config.accountId,
        bucket: config.bucket,
        prefix: config.prefix,
        credentials: {
          accessKeyId: '${env:PUSH_FIXTURE_ACCESS_KEY_ID}',
          secretAccessKey: '${env:PUSH_FIXTURE_SECRET_ACCESS_KEY}',
        },
      },
      staging: { dir: './dist' },
      mappings: [],
    });
    expect((await Fs.readText(f.dir.join('dist/dist.json'))).data).to.eql(before.data);
  });

  it('refuses changed asset bytes before writing config or calling the uploader', async () => {
    await using f = await fixture();
    await Fs.write(f.dir.join('dist/app.js'), 'changed', { throw: true });
    await expectError(() => pushSample(f.dir.absolute, f.publish), 'Sample Dist refused:');
    expect(f.calls).to.eql([]);
    expect(await Fs.exists(f.dir.join('.tmp/push.yaml'))).to.eql(false);
  });

  it('refuses a different manifest checksum before calling the uploader', async () => {
    await using f = await fixture();
    await Fs.writeJson(f.dir.join('artifact.json'), {
      ...f.artifact,
      files: [...f.artifact.files],
      integrity: `sha256-${'0'.repeat(64)}`,
    }, { throw: true });
    await expectError(() => pushSample(f.dir.absolute, f.publish), 'Sample Dist refused:');
    expect(f.calls).to.eql([]);
  });

  it('refuses artifact filename drift before writing config or calling the uploader', async () => {
    await using f = await fixture();
    await Fs.writeJson(f.dir.join('artifact.json'), {
      ...f.artifact,
      files: ['index.html', 'dist.json'],
    }, { throw: true });
    await expectError(
      () => pushSample(f.dir.absolute, f.publish),
      'Sample artifact filenames do not match the verified Dist.',
    );
    expect(f.calls).to.eql([]);
    expect(await Fs.exists(f.dir.join('.tmp/push.yaml'))).to.eql(false);
  });

  it('redacts provider failures and does not retry or attach raw causes', async () => {
    await using f = await fixture();
    let calls = 0;
    const error = await expectError(() =>
      pushSample(f.dir.absolute, () => {
        calls += 1;
        throw new Error('provider diagnostic with fixture-secret and a signed URL');
      })
    );
    expect(error.message).to.eql(
      'Sample R2 push failed. No automatic retry or cleanup was performed.',
    );
    expect(error.cause).to.eql(undefined);
    expect(calls).to.eql(1);
  });

  it('preserves a synthetic permission denial inside the uploader error wrappers', async () => {
    await using f = await fixture();
    const denial = new Deno.errors.NotCapable('Fixture permission denial.');
    const error = await expectError(() =>
      pushSample(f.dir.absolute, () => {
        throw new Error('wrapper', { cause: { error: denial } });
      })
    );
    expect(error).to.equal(denial);
  });
});

async function fixture() {
  const temp = await Fs.makeTempDir({ prefix: 'sample-r2-push-' });
  try {
    // Select the canonical fixture root before creating its Dist (macOS /var is an alias).
    const dir = Fs.toDir(await Fs.realPath(temp.absolute));
    await Fs.writeJson(dir.join('config.json'), config, { throw: true });
    await Fs.write(dir.join('dist/index.html'), '<h1>fixture</h1>', { throw: true });
    await Fs.write(dir.join('dist/app.js'), 'console.info("fixture");', { throw: true });
    await Pkg.Dist.compute({
      dir: dir.join('dist'),
      pkg: { name: '@test/r2', version: '0.0.0' },
      save: true,
    });
    const verified = await Pkg.Dist.Local.verify({ dir: dir.join('dist'), limits: DIST_LIMITS });
    if (verified.kind !== 'verified') throw new Error(`Fixture Dist refused: ${verified.kind}.`);
    const artifact = {
      integrity: verified.evidence.integrity,
      files: [...Obj.keys(verified.evidence.dist.hash.parts).map(String), 'dist.json'].sort(),
    };
    await Fs.writeJson(dir.join('artifact.json'), artifact, { throw: true });
    const calls: DeployTool.PushArgs[] = [];
    const publish: DeployTool.Lib['push'] = (args) => {
      calls.push(args);
      return Promise.resolve({
        ok: true,
        cwd: dir.absolute,
        config: String(args.config),
        targets: 1,
      });
    };
    return {
      dir,
      artifact,
      calls,
      publish,
      async [Symbol.asyncDispose]() {
        await Fs.remove(dir.absolute);
      },
    };
  } catch (error) {
    await Fs.remove(temp.absolute);
    throw error;
  }
}

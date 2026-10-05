import { describe, expect, expectError, Fs, it, Json } from '../-test.ts';
import { credentialsFrom, DIST_LIMITS, readData, readInputs } from '../m.deployment/mod.ts';
import { fixtureInputs } from './u.fixture.ts';

describe('R2 deployment sample: deployment inputs', () => {
  it('bounded JSON → exact byte limit accepted; malformed, missing, and oversized input refused', async () => {
    await using f = await fixture();
    const path = f.dir.join('data.json');
    const url = Fs.Path.toFileUrl(path);
    const data = { msg: 'hello' };
    const missing = await expectError(() => readData(url));
    expect(Fs.Snapshot.Is.failure(missing)).to.eql(true);
    expect(missing).to.include({ kind: 'missing' });
    await Fs.write(path, Json.stringify(data).padEnd(DIST_LIMITS.manifestBytes, ' '), {
      throw: true,
    });
    expect(await readData(url)).to.eql(data);
    await Fs.write(path, '{broken', { throw: true });
    await expectError(() => readData(url), 'Sample data must be valid JSON.');
    await Fs.write(path, new Uint8Array([0xff]), { throw: true });
    expect(await expectError(() => readData(url))).to.be.instanceOf(TypeError);
    await Fs.write(path, ' '.repeat(DIST_LIMITS.manifestBytes + 1), { throw: true });
    const oversized = await expectError(() => readData(url));
    expect(Fs.Snapshot.Is.failure(oversized)).to.eql(true);
    expect(oversized).to.include({ kind: 'source-limit' });
  });

  it('new record → sole authority, without distribution output or legacy fallback', async () => {
    await using f = await fixture();
    await Fs.writeJson(f.dir.join('dist.selection.json'), f.buildRecord, { throw: true });
    await Fs.writeJson(f.dir.join('dist.pin.json'), f.buildRecord.selection.pins.private, {
      throw: true,
    });
    expect((await readInputs(f.dir.absolute)).buildRecord).to.eql(f.buildRecord);
    await Fs.writeJson(f.dir.join('dist.pins.json'), {}, { throw: true });
    await expectError(
      () => readInputs(f.dir.absolute),
      'Invalid sample build record. Run deno task build',
    );
    await Fs.remove(f.dir.join('dist.pins.json'));
    await expectError(
      () => readInputs(f.dir.absolute),
      'Missing sample build record. Run deno task build',
    );
  });

  it('non-missing record failures → keep their classification rather than becoming rebuild advice', async () => {
    await using f = await fixture();
    const path = f.dir.join('dist.pins.json');
    await Fs.write(path, '{broken', { throw: true });
    await expectError(() => readInputs(f.dir.absolute), 'Sample data must be valid JSON.');
    await Fs.write(path, ' '.repeat(DIST_LIMITS.manifestBytes + 1), { throw: true });
    const error = await expectError(() => readInputs(f.dir.absolute));
    expect(Fs.Snapshot.Is.failure(error)).to.eql(true);
    expect(error).to.include({ kind: 'source-limit' });
  });

  it('configured credential names → original values preserved; absent or blank values name only missing keys', () => {
    const names = fixtureInputs().config.credentials.serve;
    const seen: string[] = [];
    const credentials = credentialsFrom(names, {
      get(name) {
        seen.push(name);
        return name === names.accessKeyId ? ' fixture-access ' : 'fixture-secret';
      },
    });
    expect(seen).to.eql([names.accessKeyId, names.secretAccessKey]);
    expect(credentials).to.eql({
      accessKeyId: ' fixture-access ',
      secretAccessKey: 'fixture-secret',
    });
    expect(() => credentialsFrom(names, { get: () => undefined })).to.throw(
      `Sample credentials are missing: ${names.accessKeyId}, ${names.secretAccessKey}.`,
    );
    for (const missing of [names.accessKeyId, names.secretAccessKey]) {
      const env = { get: (name: string) => name === missing ? ' ' : 'fixture-secret' };
      expect(() => credentialsFrom(names, env)).to.throw(
        `Sample credentials are missing: ${missing}.`,
      );
    }
  });
});

async function fixture() {
  const dir = await Fs.makeTempDir({ prefix: 'sample-r2-inputs-' });
  try {
    const inputs = fixtureInputs();
    await Fs.writeJson(dir.join('r2.config.json'), inputs.config, { throw: true });
    await Fs.writeJson(dir.join('dist.pins.json'), inputs.buildRecord, { throw: true });
    return {
      dir,
      ...inputs,
      async [Symbol.asyncDispose]() {
        await Fs.remove(dir.absolute);
      },
    };
  } catch (error) {
    await Fs.remove(dir.absolute);
    throw error;
  }
}

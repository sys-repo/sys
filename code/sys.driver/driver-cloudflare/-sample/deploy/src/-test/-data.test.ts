import { describe, expect, expectError, Fs, it, Json } from '../-test.ts';
import { readData, readInputs } from '../m.app/u.data.ts';
import { localFixture } from '../../-scripts/-test/u.fixture.ts';
import { DIST_LIMITS } from '../m.app/u.selection.ts';

describe('R2 deployment sample: bounded package data', () => {
  it('reads valid JSON at the byte limit through the real filesystem primitive', async () => {
    await using f = await fixture();
    const data = { msg: 'hello' };
    await f.write(Json.stringify(data).padEnd(DIST_LIMITS.manifestBytes, ' '));
    expect(await readData(f.url)).to.eql(data);
  });

  it('rejects malformed JSON and invalid UTF-8', async () => {
    await using f = await fixture();
    await f.write('{broken');
    await expectError(() => readData(f.url), 'Sample data must be valid JSON.');
    await f.write(new Uint8Array([0xff]));
    expect(await expectError(() => readData(f.url))).to.be.instanceOf(TypeError);
  });

  it('refuses missing and oversized files without a discovery fallback', async () => {
    await using f = await fixture();
    const missing: unknown = await expectError(() => readData(f.url));
    expect(Fs.Snapshot.Is.failure(missing)).to.eql(true);
    expect(missing).to.include({ kind: 'missing' });
    await f.write(' '.repeat(DIST_LIMITS.manifestBytes + 1));
    const oversized: unknown = await expectError(() => readData(f.url));
    expect(Fs.Snapshot.Is.failure(oversized)).to.eql(true);
    expect(oversized).to.include({ kind: 'source-limit' });
  });
});

describe('R2 deployment sample: build-record filename admission', () => {
  it('both filenames exist → only the new record is authoritative', async () => {
    await using f = await localFixture();
    await Fs.writeJson(f.dir.join('dist.selection.json'), {}, { throw: true });
    expect((await readInputs(f.dir.absolute)).buildRecord).to.eql(f.buildRecord);
  });

  it('invalid or absent new record → no fallback to either legacy filename', async () => {
    await using f = await localFixture();
    await Fs.writeJson(f.dir.join('dist.selection.json'), f.buildRecord, { throw: true });
    await Fs.writeJson(f.dir.join('dist.pin.json'), f.buildRecord.selection.pins.private, {
      throw: true,
    });
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

  it('non-missing read failures keep their classification rather than becoming rebuild advice', async () => {
    await using f = await localFixture();
    const path = f.dir.join('dist.pins.json');
    await Fs.write(path, '{broken', { throw: true });
    await expectError(() => readInputs(f.dir.absolute), 'Sample data must be valid JSON.');
    await Fs.write(path, ' '.repeat(DIST_LIMITS.manifestBytes + 1), { throw: true });
    const error: unknown = await expectError(() => readInputs(f.dir.absolute));
    expect(Fs.Snapshot.Is.failure(error)).to.eql(true);
    expect(error).to.include({ kind: 'source-limit' });
  });
});

/**
 * Helpers:
 */
async function fixture() {
  const dir = await Fs.makeTempDir({ prefix: 'sample-r2-data-' });
  const path = dir.join('data.json');
  return {
    url: Fs.Path.toFileUrl(path),
    write: (content: string | Uint8Array) => Fs.write(path, content, { throw: true }),
    async [Symbol.asyncDispose]() {
      await Fs.remove(dir.absolute);
    },
  };
}

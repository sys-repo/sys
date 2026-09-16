import { describe, expect, expectError, Fs, it, Json } from '../-test.ts';
import { readData } from '../u.data.ts';
import { DIST_LIMITS } from '../u.selection.ts';

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

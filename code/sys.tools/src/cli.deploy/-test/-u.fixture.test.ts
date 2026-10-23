import { describe, expect, expectError, expectTypeOf, Fs, it, Path } from '../../-test.ts';
import { withTmpDir } from './u.fixture.ts';

describe('Deploy: temporary-directory fixture', () => {
  it('preserves omitted, undefined and overridden prefixes', async () => {
    const options = [undefined, {}, { prefix: undefined }, { prefix: 'deploy.fixture.' }];
    for (const option of options) {
      const root = await withTmpDir(async (dir) => {
        expect(Path.basename(dir).startsWith(option?.prefix ?? 'sys.tools.deploy.')).to.eql(true);
        expect(await Fs.realPath(dir)).to.eql(dir);
        return dir;
      }, option);
      expect(await Fs.exists(root)).to.eql(false);
    }
  });

  it('delegates awaited results and cleanup', async () => {
    let root = '';
    const value = { answer: 42 };
    const result = withTmpDir(async (dir) => {
      root = dir;
      await Fs.write(Fs.join(dir, 'value.txt'), 'fixture', { throw: true });
      return value;
    });
    expectTypeOf(result).toEqualTypeOf<Promise<typeof value>>();
    expect(await result).to.equal(value);
    expect(await Fs.exists(root)).to.eql(false);
    expect(await withTmpDir(() => Promise.resolve(undefined))).to.eql(undefined);
  });

  it('delegates raw callback failures and cleanup', async () => {
    for (const cause of [new Error('original'), undefined]) {
      let root = '';
      const error = await expectError(() =>
        withTmpDir((dir) => {
          root = dir;
          return Promise.reject(cause);
        })
      );
      expect(error).to.equal(cause);
      expect(await Fs.exists(root)).to.eql(false);
    }
  });
});

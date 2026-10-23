import { describe, expect, Fs, it, Path, type t } from '../../../-test.ts';
import { withTmpDir } from './u.pull.fixture.ts';

describe('GithubPull test fixture', () => {
  it('creates temporary roots under excluded package scratch', async () => {
    const scratch = Fs.join(Deno.cwd(), '.tmp') as t.StringDir;
    await withTmpDir(async (root) => {
      expect(Path.Is.within(scratch, root)).to.eql(true);
    });
  });
});

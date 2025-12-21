import { withTmpDir } from '../../-test/-fixtures.ts';
import { describe, expect, Fs, it } from '../../../-test.ts';
import { executeStaging } from '../u.staging.execute.ts';

describe('Staging: executeStaging', () => {
  it('copy: copies source dir into staging dir (relative to cwd)', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'hello');

      const dir = { source: 'src', staging: 'stage' };
      await executeStaging([{ mode: 'copy', dir }], { cwd: tmp });

      const text = (await Fs.readText(`${tmp}/stage/a.txt`)).data!;
      expect(text).to.eql('hello');
    });
  });

  it('copy: creates staging dir if missing', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'x');

      const dir = { source: 'src', staging: 'stage' };
      await executeStaging([{ mode: 'copy', dir }], { cwd: tmp });

      const stat = (await Fs.stat(`${tmp}/stage`))!;
      expect(stat.isDirectory).to.eql(true);
    });
  });

  it('build+copy: currently throws (stub)', async () => {
    await withTmpDir(async (tmp) => {
      let threw = false;

      try {
        const dir = { source: 'src', staging: 'stage' };
        await executeStaging([{ mode: 'build+copy', dir }], { cwd: tmp });
      } catch {
        threw = true;
      }

      expect(threw).to.eql(true);
    });
  });
});

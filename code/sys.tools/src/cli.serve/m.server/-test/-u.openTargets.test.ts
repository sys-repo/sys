import { describe, expect, Fs, it } from '../../../-test.ts';
import { OpenTargets } from '../u.openTargets.ts';
import { Fixture } from '../../-test/u.ts';

describe('OpenTargets', () => {
  it('discover: includes root and only folders that have index.html + canonical dist.json', async () => {
    await withTmpDir(async (dir) => {
      await Fs.ensureDir(dir);

      await Fs.ensureDir(`${dir}/ok`);
      await Fs.write(`${dir}/ok/index.html`, '<html></html>');
      await Fs.writeJson(`${dir}/ok/dist.json`, sampleDist());

      await Fs.ensureDir(`${dir}/missing-dist`);
      await Fs.write(`${dir}/missing-dist/index.html`, '<html></html>');

      await Fs.ensureDir(`${dir}/missing-index`);
      await Fs.writeJson(`${dir}/missing-index/dist.json`, sampleDist());

      await Fs.ensureDir(`${dir}/invalid-dist`);
      await Fs.write(`${dir}/invalid-dist/index.html`, '<html></html>');
      await Fs.writeJson(`${dir}/invalid-dist/dist.json`, {});

      const targets = await OpenTargets.discover(dir);
      const paths = targets.map((m) => m.path);
      expect(paths).to.eql(['', 'ok']);
    });
  });

  it('menuOptions: emits open-prefixed command values', async () => {
    await withTmpDir(async (dir) => {
      await Fs.ensureDir(`${dir}/releases`);
      await Fs.write(`${dir}/releases/index.html`, '<html></html>');
      await Fs.writeJson(`${dir}/releases/dist.json`, sampleDist());

      const options = await OpenTargets.menuOptions({ name: 'test', dir });
      const values = options.map((m) => m.value);
      expect(values).to.eql([
        { cmd: 'open', path: '' },
        { cmd: 'open', path: 'releases' },
      ]);
      expect(options[0].name).to.include('| 2-files');
      expect(options[1].name).to.include('| 2-files');
    });
  });

  it('discover: keeps only topmost candidates from nested target chain', async () => {
    await withTmpDir(async (dir) => {
      await Fs.ensureDir(`${dir}/dev`);
      await Fs.write(`${dir}/dev/index.html`, '<html></html>');
      await Fs.writeJson(`${dir}/dev/dist.json`, sampleDist());

      await Fs.ensureDir(`${dir}/dev/fonts`);
      await Fs.write(`${dir}/dev/fonts/index.html`, '<html></html>');
      await Fs.writeJson(`${dir}/dev/fonts/dist.json`, sampleDist());

      await Fs.ensureDir(`${dir}/dev/fonts/et-book`);
      await Fs.write(`${dir}/dev/fonts/et-book/index.html`, '<html></html>');
      await Fs.writeJson(`${dir}/dev/fonts/et-book/dist.json`, sampleDist());

      const targets = await OpenTargets.discover(dir);
      const paths = targets.map((m) => m.path);
      expect(paths).to.eql(['', 'dev']);
    });
  });

  it('discover: ancestor filtering is segment-safe (`dev` does not hide `devtools`)', async () => {
    await withTmpDir(async (dir) => {
      await Fs.ensureDir(`${dir}/dev`);
      await Fs.write(`${dir}/dev/index.html`, '<html></html>');
      await Fs.writeJson(`${dir}/dev/dist.json`, sampleDist());

      await Fs.ensureDir(`${dir}/devtools`);
      await Fs.write(`${dir}/devtools/index.html`, '<html></html>');
      await Fs.writeJson(`${dir}/devtools/dist.json`, sampleDist());

      const targets = await OpenTargets.discover(dir);
      const paths = targets.map((m) => m.path);
      expect(paths).to.eql(['', 'dev', 'devtools']);
    });
  });

  it('discover: keeps deep candidate when parent is not a candidate', async () => {
    await withTmpDir(async (dir) => {
      await Fs.ensureDir(`${dir}/a/b`);
      await Fs.write(`${dir}/a/b/index.html`, '<html></html>');
      await Fs.writeJson(`${dir}/a/b/dist.json`, sampleDist());

      const targets = await OpenTargets.discover(dir);
      const paths = targets.map((m) => m.path);
      expect(paths).to.eql(['', 'a/b']);
    });
  });

  it('menuOptions: renders singular file suffix when count is 1', async () => {
    await withTmpDir(async (dir) => {
      await Fs.ensureDir(dir);
      await Fs.write(`${dir}/hello.txt`, 'hi');

      const options = await OpenTargets.menuOptions({ name: 'test', dir });
      expect(options).to.have.length(1);
      expect(options[0].value).to.eql({ cmd: 'open', path: '' });
      expect(options[0].name).to.include('| 1-file');
    });
  });
});

const sampleDist = () => Fixture.distDoc({ builtAt: 1746520471244 });

async function withTmpDir(fn: (dir: string) => Promise<void>) {
  const dir = await Fs.makeTempDir({ prefix: 'sys.tools.serve.open-targets.' });
  try {
    await fn(dir.absolute);
  } finally {
    await Fs.remove(dir.absolute);
  }
}

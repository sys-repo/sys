import { type t, c, describe, expect, Fs, it, Path, SAMPLE } from '../../-test.ts';
import { Vite } from '../../mod.ts';
import { ViteConfig } from '../mod.ts';

describe('ViteConfig.fromFile', () => {
  const { brightCyan: cyan } = c;

  const print = (res: t.ViteConfigFromFile) => {
    console.info();
    console.info(cyan(`↓ Type: ${c.bold('ViteConfigFromFile')}`));
    console.info(res);
    console.info();
  };

  it('from "/<root-dir>/"', async () => {
    const rootDir = SAMPLE.Dirs.sample2;
    const res = await ViteConfig.fromFile(rootDir);
    print(res);

    expect(res.exists).to.eql(true);
    expect(res.error).to.eql(undefined);

    expect(res.paths?.cwd).to.eql(Path.resolve(rootDir));
    expect(res.paths?.app.entry).to.eql('src/-entry/index.html');
    expect(res.paths?.app.base).to.eql('./');
    expect(res.paths?.app.outDir).to.eql('dist/');
  });

  it('from "/<root-dir>/vite.config.ts" (with config filename)', async () => {
    const rootDir = SAMPLE.Dirs.sample2;
    const resA = await ViteConfig.fromFile(Path.join(rootDir, 'vite.config.ts'));
    const resB = await ViteConfig.fromFile(rootDir);
    expect(resA.exists).to.eql(true);
    expect(resA.error).to.eql(undefined);
    expect(resA).to.eql(resB);
  });

  it('loads main samples', async () => {
    const test = async (path: t.StringPath) => {
      const res = await Vite.Config.fromFile(path);
      expect(res.error).to.eql(undefined);
      expect(ViteConfig.Is.paths(res.paths)).to.be.true;
    };

    await test('src/-test/vite.sample-config/simple/vite.config.ts');
    await test('src/-test/vite.sample-config/custom/vite.config.ts');
  });

  it('loads copied fixture from external temp directory', async () => {
    const fs = await Fs.makeTempDir({ prefix: 'ViteConfig.fromFile.external.' });
    try {
      const dir = Fs.join(fs.absolute, Fs.basename(SAMPLE.Dirs.sampleBridge));
      await Fs.copy(SAMPLE.Dirs.sampleBridge, dir);
      const res = await ViteConfig.fromFile(dir);
      expect(res.exists).to.eql(true);
      expect(res.error).to.eql(undefined);
      expect(ViteConfig.Is.paths(res.paths)).to.eql(true);
      expect(res.paths?.cwd).to.eql(dir);
      expect(res.paths?.app.entry).to.eql('index.html');
    } finally {
      await Fs.remove(fs.absolute, { log: false });
    }
  });

  it('fail: not found', async () => {
    const res = await ViteConfig.fromFile('/foo/404/vite.config.ts');
    expect(res.exists).to.eql(false);
    expect(res.error?.message).to.include('A config file could not be found in directory');
    expect(res.error?.message).to.include(': /foo/404');
  });
});

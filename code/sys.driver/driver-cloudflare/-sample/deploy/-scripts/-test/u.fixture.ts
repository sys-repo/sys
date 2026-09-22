import { fixtureConfig } from '../../src/-test/u.config.ts';
import { buildSample } from '../u.build.ts';
import { Fs, Obj, Pkg } from './common.ts';

type Assets = Record<string, string | Uint8Array>;

/** Build a real Dist fixture with a stub Vite build. */
export async function localFixture() {
  const temp = await Fs.makeTempDir({ prefix: 'sample-r2-build-' });
  try {
    const dir = Fs.toDir(await Fs.realPath(temp.absolute));
    const config = fixtureConfig();
    await Fs.writeJson(dir.join('r2.config.json'), config, { throw: true });
    const emit = async (html = 'first', assets: Assets = {}) => {
      await Fs.remove(dir.join('dist'));
      const files = { 'index.html': html, 'app.js': 'export {};', 'app.css': 'body {}', ...assets };
      for (const [path, value] of Obj.entries(files)) {
        await Fs.write(dir.join('dist', path), value, { throw: true });
      }
      const computed = await Pkg.Dist.compute({
        dir: dir.join('dist'),
        pkg: { name: '@test/r2', version: '0.0.0' },
        save: true,
      });
      return { ok: true, manifest: computed.manifest, toString: () => 'fixture Vite build' };
    };
    const build = async (html = 'first', assets: Assets = {}) => {
      const result = await buildSample(config, dir.absolute, () => emit(html, assets));
      return result.buildRecord;
    };
    const buildRecord = await build();
    return {
      dir,
      config,
      buildRecord,
      emit,
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

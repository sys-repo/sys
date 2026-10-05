import { buildSample } from '../task.build.ts';
import { readInputs, selectPublication } from '../../src/m.deployment/mod.ts';
import { describe, expect, expectError, Fs, Hash, it, ROOT, type t } from './common.ts';
import { localFixture } from './u.fixture.ts';

describe('R2 deployment sample: one-build publication projections', () => {
  it('one build → private HTML, public assets, and a reloadable build record', async () => {
    await using f = await localFixture();
    const font = new Uint8Array([0, 255, 254, 128]);
    let builds = 0;
    const { buildRecord } = await buildSample(f.config, f.dir.absolute, (args) => {
      builds++;
      expect(args).to.eql({ root: f.dir.absolute, publicAssetBase: f.config.publicAssetBase });
      return f.emit('fixture shell', { 'images/logo.svg': '<svg />', 'fonts/ui.woff2': font });
    });
    expect(builds).to.eql(1);
    const selected = await selectPublication(buildRecord.selection, f.dir.absolute);
    expect(selected.private).to.eql(['dist.json', 'index.html']);
    expect(selected.public).to.eql([
      'app.css',
      'app.js',
      'dist.json',
      'fonts/ui.woff2',
      'images/logo.svg',
    ]);
    expect((await readInputs(f.dir.absolute)).buildRecord).to.eql(buildRecord);
    expect((await Fs.readJson(f.dir.join('dist.pins.json'))).data).to.eql(buildRecord);
    expect(await Fs.exists(f.dir.join('dist.selection.json'))).to.eql(false);
    const source = (await Fs.readJson<t.DistPkg>(f.dir.join('dist/dist.json'))).data!;
    const privateDist = (await Fs.readJson<t.DistPkg>(f.dir.join('dist.private/dist.json'))).data!;
    expect(source.build.size.total).not.to.eql(privateDist.build.size.total);
    expect(buildRecord).to.include({ bundleSize: source.build.size.total });
    expect(Object.keys(buildRecord)).to.eql(['publicAssetBase', 'bundleSize', 'selection']);
    expect(Object.keys(buildRecord.selection)).to.eql(['pins']);
  });

  it('root metadata and reported totals change → pins and admitted payload total stay stable', async () => {
    await using f = await localFixture();
    const original = f.buildRecord;
    const { buildRecord } = await buildSample(f.config, f.dir.absolute, async () => {
      const built = await f.emit();
      const path = f.dir.join('dist/dist.json');
      const { data } = await Fs.readJson<t.DistPkg>(path);
      if (!data) throw new Error('Missing fixture manifest.');
      await Fs.writeJson(path, {
        ...data,
        pkg: { name: '@untrusted/root-label', version: '99.0.0' },
        build: { ...data.build, time: data.build.time + 1, size: { total: 1, pkg: 1 } },
      }, { throw: true });
      return built;
    });
    expect(buildRecord.selection).to.eql(original.selection);
    expect(buildRecord.bundleSize).to.eql(original.bundleSize);
    expect(buildRecord.bundleSize).to.eql(
      new TextEncoder().encode('firstexport {};body {}').length,
    );
    expect((await readInputs(f.dir.absolute)).buildRecord).to.eql(buildRecord);
  });

  it('two wax seal paths → identical public bytes, never private payloads', async () => {
    const publicPath = 'images/wax-seal.v1.png';
    const png = await Fs.read(Fs.join(ROOT, 'public', publicPath));
    const managed = await Fs.read(Fs.join(ROOT, 'src/ui', publicPath));
    if (!png.ok || !png.data || !managed.ok || !managed.data) {
      throw new Error('Both versioned sample PNGs must be readable.');
    }
    // Same artwork and revision: only build treatment differs between the two examples.
    expect(managed.data).to.eql(png.data);
    expect(Hash.sha256(png.data)).to.eql(
      'sha256-9a110325ca0d22eb23c6c88d60960fdd3c9d9b9c5ccaa331b0ac27679239d83a',
    );

    // This fixture proves projection, not Vite's fingerprint generation or HTML rewriting.
    const managedPath = 'pkg/a.fixture.png';
    await using f = await localFixture();
    const buildRecord = await f.build('shell', {
      [publicPath]: png.data,
      [managedPath]: managed.data,
    });
    const selected = await selectPublication(buildRecord.selection, f.dir.absolute);
    expect(selected.private).to.eql(['dist.json', 'index.html']);
    expect(selected.public).to.eql(['app.css', 'app.js', 'dist.json', publicPath, managedPath]);
    for (const path of [publicPath, managedPath]) {
      const published = await Fs.read(f.dir.join('dist.public', path));
      expect(published.ok).to.eql(true);
      expect(published.data).to.eql(png.data);
      expect(await Fs.exists(f.dir.join('dist.private', path))).to.eql(false);
    }
  });

  it('integrity-bearing private HTML → unchanged public JS/CSS bytes and verified projections', async () => {
    await using f = await localFixture();
    const js = 'export const value = 1;';
    const css = 'body { color: rgb(12, 34, 56); }';
    const base = f.config.publicAssetBase;
    const jsIntegrity = Hash.sha256(js, { encoding: 'base64' });
    const cssIntegrity = Hash.sha256(css, { encoding: 'base64' });
    const html = [
      `<link rel="stylesheet" href="${base}app.css" integrity="${cssIntegrity}" crossorigin="anonymous">`,
      `<script type="module" src="${base}app.js" integrity="${jsIntegrity}" crossorigin="anonymous"></script>`,
    ].join('\n');

    const buildRecord = await f.build(html, { 'app.js': js, 'app.css': css });
    const selected = await selectPublication(buildRecord.selection, f.dir.absolute);
    expect(selected.private).to.eql(['dist.json', 'index.html']);
    expect(selected.public).to.eql(['app.css', 'app.js', 'dist.json']);
    expect((await Fs.readText(f.dir.join('dist.private/index.html'))).data).to.eql(html);
    expect((await Fs.readText(f.dir.join('dist.public/app.js'))).data).to.eql(js);
    expect((await Fs.readText(f.dir.join('dist.public/app.css'))).data).to.eql(css);
  });

  it('captures the public base before the builder yields; later config cannot retarget old HTML', async () => {
    await using f = await localFixture();
    const config = { ...f.config };
    const base = config.publicAssetBase;
    const { buildRecord } = await buildSample(config, f.dir.absolute, async (args) => {
      await Promise.resolve();
      config.publicAssetBase = 'https://other.example.test/sample/ui/';
      await Fs.writeJson(f.dir.join('r2.config.json'), config, { throw: true });
      expect(args.publicAssetBase).to.eql(base);
      return await f.emit(`<script type="module" src="${args.publicAssetBase}app.js"></script>`);
    });
    expect(buildRecord.publicAssetBase).to.eql(base);
    const html = await Fs.readText(f.dir.join('dist.private/index.html'));
    expect(html.data).to.eql(`<script type="module" src="${base}app.js"></script>`);
    await expectError(() => readInputs(f.dir.absolute), 'Run deno task build');
  });

  it('rebuild removes stale generated outputs without copying unrelated/private task inputs', async () => {
    await using f = await localFixture();
    await Fs.write(f.dir.join('dist.public/stale.js'), 'stale', { throw: true });
    await Fs.write(f.dir.join('dist.private/other.html'), 'stale', { throw: true });
    await Fs.write(f.dir.join('private-input.json'), 'not frontend data', { throw: true });
    await Fs.write(f.dir.join('.tmp/keep.txt'), 'unrelated', { throw: true });
    await Fs.writeJson(f.dir.join('dist.selection.json'), f.buildRecord, { throw: true });
    const buildRecord = await f.build();
    expect(await Fs.exists(f.dir.join('dist.selection.json'))).to.eql(false);
    const selected = await selectPublication(buildRecord.selection, f.dir.absolute);
    expect(selected.public).to.eql(['app.css', 'app.js', 'dist.json']);
    expect(selected.private).to.eql(['dist.json', 'index.html']);
    expect((await Fs.readText(f.dir.join('.tmp/keep.txt'))).data).to.eql('unrelated');
    expect((await Fs.readText(f.dir.join('private-input.json'))).data).to.eql('not frontend data');
  });

  it('failed or thrown build → no publishable selection or old projection fallback', async () => {
    for (const throws of [false, true]) {
      await using f = await localFixture();
      await Fs.writeJson(f.dir.join('dist.selection.json'), f.buildRecord, { throw: true });
      await Fs.writeJson(f.dir.join('dist.pins.json'), f.buildRecord, { throw: true });
      await Fs.writeJson(f.dir.join('dist.unrelated.json'), { keep: true }, { throw: true });
      let observed: boolean[] | undefined;
      const failure = new Error('fixture builder failure');
      const error = await expectError(() =>
        buildSample(f.config, f.dir.absolute, async () => {
          observed = [
            await Fs.exists(f.dir.join('dist.pins.json')),
            await Fs.exists(f.dir.join('dist.selection.json')),
          ];
          if (throws) throw failure;
          return { ok: false, toString: () => 'failed fixture' };
        })
      );
      expect(observed).to.eql([false, false]);
      if (throws) expect(error).to.equal(failure);
      else expect(error.message).to.eql('Sample UI build failed.');
      expect(await Fs.exists(f.dir.join('dist.selection.json'))).to.eql(false);
      expect(await Fs.exists(f.dir.join('dist.pins.json'))).to.eql(false);
      expect((await Fs.readJson(f.dir.join('dist.unrelated.json'))).data).to.eql({ keep: true });
      expect(await Fs.exists(f.dir.join('dist.private'))).to.eql(false);
      expect(await Fs.exists(f.dir.join('dist.public'))).to.eql(false);
    }
  });

  it('either record invalidation fails → preserve the denial and never touch outputs or build', async () => {
    for (const filename of ['dist.pins.json', 'dist.selection.json']) {
      await using f = await localFixture();
      await Fs.writeJson(f.dir.join('dist.selection.json'), f.buildRecord, { throw: true });
      const target = f.dir.join(filename);
      const denied = new Deno.errors.NotCapable('Synthetic fixture removal denial.');
      const remove = Deno.remove;
      let builds = 0;
      // Replace only the host removal boundary; all surrounding filesystem work remains real.
      Deno.remove = (path, options) =>
        path === target ? Promise.reject(denied) : remove(path, options);
      try {
        const error = await expectError(() =>
          buildSample(f.config, f.dir.absolute, () => {
            builds++;
            return f.emit();
          })
        );
        expect(error).to.equal(denied);
      } finally {
        Deno.remove = remove;
      }
      expect(builds).to.eql(0);
      expect(await Fs.exists(target)).to.eql(true);
      expect(await Fs.exists(f.dir.join('dist.private/index.html'))).to.eql(true);
      expect(await Fs.exists(f.dir.join('dist.public/app.js'))).to.eql(true);
    }
  });

  it('filename-policy refusal → no persisted build record', async () => {
    await using f = await localFixture();
    await expectError(
      () => f.build('shell', { 'sw.js': 'fixture worker' }),
      'select/policy-failure',
    );
    expect(await Fs.exists(f.dir.join('dist.pins.json'))).to.eql(false);
  });

  it('payload changed after manifest generation → no selected projections', async () => {
    await using f = await localFixture();
    const build = async () => {
      const built = await f.emit();
      await Fs.write(f.dir.join('dist/app.js'), 'changed after Dist generation', { throw: true });
      return built;
    };
    await expectError(
      () => buildSample(f.config, f.dir.absolute, build),
      'Sample projection refused: source/content-mismatch.',
    );
    expect(await Fs.exists(f.dir.join('dist.pins.json'))).to.eql(false);
  });
});

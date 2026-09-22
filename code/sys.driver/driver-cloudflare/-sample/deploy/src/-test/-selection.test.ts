import { CompositeHash, Hash } from '@sys/crypto/hash';
import { describe, expect, Fs, it, type t } from '../-test.ts';
import {
  configFrom,
  partitionBuild,
  selectionFiles,
  snapshotInputs,
} from '../m.app/u.selection.ts';
import { fixtureConfig } from './u.config.ts';

describe('R2 deployment sample: target configuration', () => {
  it('sample defaults → one environment pair for serving and both publishing roles', async () => {
    const path = Fs.Path.fromFileUrl(new URL('../../r2.config.json', import.meta.url));
    const { data } = await Fs.readJson(path);
    const { credentials } = configFrom(data);
    const shared = {
      accessKeyId: 'SYS_TEST_R2_KEY_ID',
      secretAccessKey: 'SYS_TEST_R2_KEY_SECRET',
    };
    expect(credentials).to.eql({ serve: shared, pushPrivate: shared, pushPublic: shared });
  });

  it('captures two buckets, the public URL mapping, and operation-specific credential names', () => {
    const config = fixtureConfig();
    const captured = configFrom(config);
    config.targets.private.prefix = 'other';
    config.credentials.serve.accessKeyId = 'OTHER_KEY';
    expect(captured).to.eql(fixtureConfig());
    expect(Object.isFrozen(captured)).to.eql(true);
  });

  it('refuses an ambiguous target or a public URL outside the configured key mapping', () => {
    const config = fixtureConfig();
    const cases = [
      { ...config, targets: { ...config.targets, public: config.targets.private } },
      { ...config, publicAssetBase: 'http://assets.example.test/sample/ui/' },
      { ...config, publicAssetBase: 'https://user:secret@assets.example.test/sample/ui/' },
      { ...config, publicAssetBase: 'https://assets.example.test/other/' },
      { ...config, publicAssetBase: `${config.publicAssetBase}?signature=secret` },
      { ...config, publicAssetBase: `${config.publicAssetBase}#fragment` },
      { ...config, publicAssetBase: config.publicAssetBase.slice(0, -1) },
      {
        ...config,
        targets: { ...config.targets, private: { bucket: 'private', prefix: '../ui' } },
      },
      { ...config, bucket: 'legacy-target' },
    ];
    for (const value of cases) {
      expect(() => configFrom(value)).to.throw('Invalid sample configuration.');
    }
  });
});

describe('R2 deployment sample: filename policy', () => {
  it('frontend inventory → private shell and public assets, with manifest only in delivery lists', () => {
    const assets = ['images/logo.svg', 'fonts/ui.woff2', 'data.json', 'app.js', 'app.css'];
    expect(partitionBuild(inventory([...assets, 'index.html']))).to.eql({
      private: ['index.html'],
      public: ['app.css', 'app.js', 'data.json', 'fonts/ui.woff2', 'images/logo.svg'],
    });
    expect(selectionFiles(inventory(['index.html']), 'private')).to.eql([
      'dist.json',
      'index.html',
    ]);
    expect(selectionFiles(inventory(assets), 'public')).to.eql([
      'app.css',
      'app.js',
      'data.json',
      'dist.json',
      'fonts/ui.woff2',
      'images/logo.svg',
    ]);
  });

  it('missing required files or wrong audience → filename-policy refusal', () => {
    const cases = [
      ['private', []],
      ['private', ['other.html']],
      ['private', ['index.html', 'app.js']],
      ['build', ['app.js', 'app.css']],
      ['build', ['index.html', 'app.css']],
      ['build', ['index.html', 'app.js']],
      ['public', ['app.css']],
      ['public', ['app.js']],
      ['public', ['index.html', 'app.js', 'app.css']],
    ] as const;
    for (const [role, files] of cases) {
      expect(() => selectionFiles(inventory(files), role), `${role}: ${files.join(', ')}`)
        .to.throw(`Invalid sample ${role} manifest filenames.`);
    }
  });

  it('documents, workers, sources, secrets, or non-ASCII filenames → no build or public inventory', () => {
    const paths = [
      'other.html',
      'sw.js',
      'worker.123.js',
      'nested/service-worker.js',
      'source.ts',
      'app.js.map',
      'secret.pem',
      'é.js',
      'dist.json',
    ];
    for (const role of ['build', 'public'] as const) {
      const required = role === 'build'
        ? ['index.html', 'app.js', 'app.css']
        : ['app.js', 'app.css'];
      for (const path of paths) {
        expect(() => selectionFiles(inventory([...required, path]), role), `${role}: ${path}`)
          .to.throw(`Invalid sample ${role} manifest filenames.`);
      }
    }
  });
});

describe('R2 deployment sample: build selection', () => {
  it('sample build record → shared pins and recorded base captured together', () => {
    const config = fixtureConfig();
    const pin = { 'dist.json': `sha256-${'a'.repeat(64)}` };
    const buildRecord = {
      selection: { pins: { private: pin, public: pin } },
      publicAssetBase: config.publicAssetBase,
    };
    expect(snapshotInputs(config, buildRecord)).to.eql({ config, buildRecord });
  });

  it('caller mutation → captured pins, public base, and configuration remain unchanged', () => {
    const config = fixtureConfig();
    const buildRecord = {
      selection: {
        pins: {
          private: { 'dist.json': `sha256-${'a'.repeat(64)}` },
          public: { 'dist.json': `sha256-${'b'.repeat(64)}` },
        },
      },
      publicAssetBase: config.publicAssetBase,
    };
    const captured = snapshotInputs(config, buildRecord);
    config.targets.public.prefix = 'other';
    config.publicAssetBase = 'https://other.example.test/other/';
    config.credentials.serve.secretAccessKey = 'OTHER_SECRET';
    buildRecord.selection.pins.private['dist.json'] = `sha256-${'c'.repeat(64)}`;
    buildRecord.selection.pins.public['dist.json'] = `sha256-${'d'.repeat(64)}`;
    buildRecord.publicAssetBase = 'https://other.example.test/other/';
    expect(captured.config).to.eql(fixtureConfig());
    expect(captured.buildRecord).to.eql({
      selection: {
        pins: {
          private: { 'dist.json': `sha256-${'a'.repeat(64)}` },
          public: { 'dist.json': `sha256-${'b'.repeat(64)}` },
        },
      },
      publicAssetBase: fixtureConfig().publicAssetBase,
    });
    expect(Object.isFrozen(captured.buildRecord)).to.eql(true);
    expect(Object.isFrozen(captured.buildRecord.selection.pins.private)).to.eql(true);
    expect(Object.isFrozen(captured.config.credentials.serve)).to.eql(true);
  });

  it('old formats, missing or extra fields, or changed base → explicit rebuild guidance', () => {
    const config = fixtureConfig();
    const pin = { 'dist.json': `sha256-${'a'.repeat(64)}` };
    const selection = { pins: { private: pin, public: pin } };
    const buildRecord = { selection, publicAssetBase: config.publicAssetBase };
    const invalid = [
      { private: pin, public: pin, publicAssetBase: config.publicAssetBase },
      { ...selection, bindings: { publicAssetBase: config.publicAssetBase } },
      { ...buildRecord, selection: { ...selection, bindings: {} } },
      { ...buildRecord, selection: { pins: { private: pin } } },
      { ...buildRecord, selection: { pins: { ...selection.pins, extra: pin } } },
      { selection },
      { ...buildRecord, publicAssetBase: undefined },
      { ...buildRecord, publicAssetBase: 'http://assets.example.test/sample/ui/' },
      { ...buildRecord, publicAssetBase: 'https://other.example.test/sample/ui/' },
      { ...buildRecord, extra: 'secret' },
      { ...buildRecord, [Symbol()]: 'secret' },
    ];
    for (const value of invalid) {
      expect(() => snapshotInputs(config, value)).to.throw('Run deno task build');
    }
    expect(snapshotInputs(config, buildRecord).buildRecord).to.eql(buildRecord);
  });

  it('build-record accessors → refusal without invoking getters', () => {
    const config = fixtureConfig();
    let calls = 0;
    const buildRecord = {
      get selection() {
        calls++;
        return {};
      },
      publicAssetBase: config.publicAssetBase,
    };
    expect(() => snapshotInputs(config, buildRecord)).to.throw('Run deno task build');
    expect(calls).to.eql(0);
  });
});

/** Filename policy needs only an inventory; empty payloads avoid filesystem/build fixtures. */
function inventory(paths: readonly string[]): t.DistPkg {
  const parts = Object.fromEntries(paths.map((path) => [path, `${Hash.sha256('')}:size=0`]));
  return {
    type: 'https://example.test/dist',
    build: {
      time: 0,
      size: { total: 0, pkg: 0 },
      builder: '@test/builder@1.0.0',
      runtime: 'fixture',
      hash: { policy: 'https://example.test/hash' },
    },
    hash: { digest: CompositeHash.digest(parts), parts },
  };
}

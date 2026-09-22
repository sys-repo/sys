import { describe, expect, Fs, it } from '../-test.ts';
import { configFrom, snapshotInputs } from '../m.app/u.selection.ts';
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

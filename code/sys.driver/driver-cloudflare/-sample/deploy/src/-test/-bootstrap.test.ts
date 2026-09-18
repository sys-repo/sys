import { CompositeHash, Hash } from '@sys/crypto/hash';
import { describe, expect, expectError, it, Json, type t } from '../-test.ts';
import { appFrom } from '../entry.ts';
import { createApp } from '../m.app/mod.ts';
import { DIST_LIMITS } from '../m.app/u.selection.ts';
import { remoteFixture } from './u.fixture.ts';

const encoder = new TextEncoder();

describe('R2 deployment sample: pinned manifest bootstrap', () => {
  it('manifest admission → whole app, without local build output', async () => {
    using f = await remoteFixture();
    const app = await createApp(f);
    expect(f.signed).to.eql(['sample/ui/dist.json']);
    expect(f.fetched.length).to.eql(1);

    const response = await app.fetch(new Request('http://sample.test/api/hello'));
    const data = await response.json();
    expect(data).to.eql({ msg: '👋 hello world!' });
    expect(f.fetched.length).to.eql(1);

    for (const path of ['/', '/index.html', '/pkg/file.js', '/dist.json']) {
      const res = await app.fetch(new Request(`http://sample.test/ui${path}`));
      expect(res.status).to.eql(200);
      await res.body?.cancel();
    }
    expect(f.signed).to.eql([
      'sample/ui/dist.json',
      'sample/ui/index.html',
      'sample/ui/index.html',
      'sample/ui/pkg/file.js',
      'sample/ui/dist.json',
    ]);
  });

  it('acquisition or admission refusal → no app and no retry', async () => {
    const cases = [
      { bytes: encoder.encode('wrong'), status: 200, expected: 'integrity-mismatch' },
      { bytes: encoder.encode('{'), status: 200, matched: true, expected: 'malformed' },
      { bytes: new Uint8Array([0xff]), status: 200, matched: true, expected: 'malformed' },
      { bytes: new Uint8Array(DIST_LIMITS.manifestBytes + 1), status: 200, expected: 'HTTP 413' },
      { bytes: null, status: 404, expected: 'HTTP 404' },
      { bytes: null, status: 500, expected: 'HTTP 502' },
      { bytes: null, status: 302, expected: 'HTTP 502' },
    ];
    for (const value of cases) {
      using f = await remoteFixture();
      f.read = () => Promise.resolve(new Response(value.bytes, { status: value.status }));
      if (value.matched && value.bytes) f.pin['dist.json'] = Hash.sha256(value.bytes);
      await expectError(() => createApp(f), value.expected);
      expect(f.signed).to.eql(['sample/ui/dist.json']);
      expect(f.fetched.length).to.eql(1);
    }
  });

  it('checksum-matched metadata or filename-policy failure → no app', async () => {
    for (const variant of ['total', 'index', 'filename']) {
      using f = await remoteFixture();
      if (variant === 'total') f.dist.build.size.total++;
      if (variant === 'index') {
        f.dist.hash.parts['other.html'] = f.dist.hash.parts['index.html'];
        delete f.dist.hash.parts['index.html'];
      }
      if (variant === 'filename') {
        f.dist.hash.parts['pkg/é.js'] = f.dist.hash.parts['pkg/file.js'];
        delete f.dist.hash.parts['pkg/file.js'];
      }
      f.dist.hash.digest = CompositeHash.digest(f.dist.hash.parts);
      const bytes = encoder.encode(Json.stringify(f.dist));
      f.content.set('dist.json', bytes);
      f.pin['dist.json'] = Hash.sha256(bytes);
      await expectError(() => createApp(f), variant === 'total' ? 'malformed' : 'filenames');
      expect(f.fetched.length).to.eql(1);
    }
  });

  it('invalid pin or target → refusal before storage', async () => {
    using f = await remoteFixture();
    const pins = [
      { integrity: f.pin['dist.json'], files: ['index.html', 'dist.json'] },
      { ...f.pin, files: ['index.html'] },
      { 'dist.json': `${f.pin['dist.json']}:size=1` },
    ];
    for (const pin of pins) {
      await expectError(
        () => createApp({ ...f, pin: pin as t.DistPin }),
        'Invalid sample Dist pin.',
      );
    }
    await expectError(() => createApp({ ...f, bucket: { name: 'other' } }), 'bucket');
    expect(f.signed).to.eql([]);
    expect(f.fetched).to.eql([]);
  });

  it('mutation during signing → retained config, pin, signer, and route inventory', async () => {
    using f = await remoteFixture();
    const config = { ...f.config };
    const pin = { ...f.pin };
    const sign = f.bucket.presignGet;
    f.bucket.presignGet = (key) => {
      config.prefix = 'other/ui';
      pin['dist.json'] = Hash.sha256('other');
      f.bucket.name = 'other';
      f.bucket.presignGet = () => {
        throw new Error('replacement signer');
      };
      return sign(key);
    };
    const app = await createApp({ config, pin, bucket: f.bucket });
    f.content.set('dist.json', encoder.encode('{}'));
    f.content.set('pkg/file.js', encoder.encode('changed asset'));
    const asset = await app.fetch(new Request('http://sample.test/ui/pkg/file.js'));
    expect(await asset.text()).to.eql('changed asset'); // Relay, not per-response asset verification.
    const missing = await app.fetch(new Request('http://sample.test/ui/new.js'));
    expect(missing.status).to.eql(404);
    expect(f.signed).to.eql(['sample/ui/dist.json', 'sample/ui/pkg/file.js']);
  });

  it('credential callbacks → entry retains target, pin, and credential names', async () => {
    using f = await remoteFixture();
    const config = { ...f.config, credentials: { ...f.config.credentials } };
    const pin = { ...f.pin };
    const names: string[] = [];
    const app = await appFrom({ config, pin }, {
      get(name) {
        names.push(name);
        config.prefix = 'other/ui';
        config.credentials.secretAccessKey = 'OTHER_SECRET';
        pin['dist.json'] = Hash.sha256('other');
        return 'fixture-only-credential';
      },
    });
    expect(names).to.eql([
      f.config.credentials.accessKeyId,
      f.config.credentials.secretAccessKey,
    ]);
    const paths = f.fetched.map((req) => new URL(req.url).pathname);
    expect(paths).to.eql(['/sample/sample/ui/dist.json']);

    const response = await app.fetch(new Request('http://sample.test/api/hello'));
    expect(response.status).to.eql(200);
  });

  it('cancelled bootstrap → no app', async () => {
    for (const preCancelled of [true, false]) {
      using f = await remoteFixture();
      const controller = new AbortController();
      if (preCancelled) controller.abort();
      f.read = () => {
        controller.abort();
        return Promise.resolve(new Response(new Uint8Array(f.manifest)));
      };
      await expectError(() => createApp({ ...f, signal: controller.signal }), '499');
      expect(f.fetched.length).to.eql(preCancelled ? 0 : 1);
    }
  });

  it('storage deadline → no app, one read, and an aborted transport', async () => {
    using f = await remoteFixture();
    let aborted = false;
    f.read = (req) => {
      return new Promise((_resolve, reject) => {
        req.signal.addEventListener('abort', () => {
          aborted = true;
          reject(new Error('fixture timeout'));
        }, { once: true });
      });
    };
    await expectError(() => createApp(f), 'HTTP 504');
    expect(aborted).to.eql(true);
    expect(f.fetched.length).to.eql(1);
  });
});

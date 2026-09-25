import { describe, expect, it, type t } from '../../-test.ts';
import { R2 } from '../mod.ts';
import { accountId, credentials, fakeTransport } from './u.fixture.ts';

describe('R2.Service', () => {
  it('creates service and bucket handles with R2-shaped identity', () => {
    const service = R2.Service.create({
      accountId,
      credentials,
      transport: fakeTransport(),
    });
    const bucket = service.bucket('assets', { readOrigin: 'https://bytes.example.com/root/' });

    expect(service.accountId).to.equal(accountId);
    expect(service.storageUrl).to.equal(`https://${accountId}.r2.cloudflarestorage.com`);
    expect(bucket.name).to.equal('assets');
    expect(bucket.readOrigin).to.equal('https://bytes.example.com/root');
  });

  it('delegates bucket operations through injected transport', async () => {
    const calls: unknown[] = [];
    let context: t.R2.Bucket.TransportContext | undefined;
    const service = R2.Service.create({
      accountId,
      credentials: { ...credentials, sessionToken: 'session' },
      transport(ctx) {
        context = ctx;
        return fakeTransport(calls)(ctx);
      },
    });

    const bucket = service.bucket('assets');
    const stat = await bucket.stat('index.html');
    const read = await bucket.read('index.html');
    const write = await bucket.write('index.html', '<h1/>', { mediaType: 'text/html' });
    await bucket.remove('old.html');

    const listed: t.R2.ObjectInfo[] = [];
    for await (const object of bucket.list({ prefix: 'assets/', limit: 1 })) listed.push(object);

    expect(context).to.eql({
      accountId,
      storageUrl: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: 'access-key',
        secretAccessKey: 'secret-key',
        sessionToken: 'session',
      },
      bucketName: 'assets',
    });
    expect(stat?.key).to.equal('index.html');
    expect(await read.text()).to.equal('hello');
    expect(write.etag).to.equal('write-etag');
    expect(listed).to.eql([{ key: 'assets/app.js', size: 12 }]);
    expect(calls).to.eql([
      ['stat', 'index.html'],
      ['read', 'index.html'],
      ['write', 'index.html', '<h1/>', { mediaType: 'text/html' }],
      ['remove', 'old.html'],
      ['list', { prefix: 'assets/', limit: 1 }],
    ]);
  });

  it('normalizes sparse list options before transport delegation', async () => {
    const calls: unknown[] = [];
    const bucket = R2.Service.create({
      accountId,
      credentials,
      transport: fakeTransport(calls),
    }).bucket('assets');

    for await (const _object of bucket.list({ prefix: '', limit: 0, pageSize: 1 })) break;
    for await (const _object of bucket.list({})) break;

    expect(calls).to.eql([
      ['list', { prefix: '', limit: 0, pageSize: 1 }],
      ['list', undefined],
    ]);
  });

  it('preserves nonblank object keys exactly before transport delegation', async () => {
    const calls: unknown[] = [];
    const bucket = R2.Service.create({
      accountId,
      credentials,
      transport: fakeTransport(calls),
    }).bucket('assets');

    await bucket.read(' index.html ');
    expect(calls).to.eql([['read', ' index.html ']]);
  });

  it('rejects rooted or blank object keys before transport delegation', () => {
    const calls: unknown[] = [];
    const bucket = R2.Service.create({
      accountId,
      credentials,
      transport: fakeTransport(calls),
    }).bucket('assets');

    expect(() => bucket.read('/index.html')).to.throw(/rootless/);
    expect(() => bucket.read('./index.html')).to.throw(/rootless/);
    expect(() => bucket.read(' ')).to.throw(/object key is required/);
    expect(calls).to.eql([]);
  });

  it('rejects malformed bucket options before transport construction', () => {
    let created = false;
    const service = R2.Service.create({
      accountId,
      credentials,
      transport(ctx) {
        created = true;
        return fakeTransport()(ctx);
      },
    });

    expect(() => service.bucket(' ')).to.throw(/bucket name is required/);
    expect(() => service.bucket('assets', { readOrigin: 'file:///tmp/assets' })).to.throw(
      /absolute http\(s\) URL/,
    );
    expect(created).to.equal(false);
  });

  it('rejects malformed list options before transport delegation', () => {
    const calls: unknown[] = [];
    const bucket = R2.Service.create({
      accountId,
      credentials,
      transport: fakeTransport(calls),
    }).bucket('assets');

    expect(() => bucket.list({ prefix: '/assets' })).to.throw(/rootless/);
    expect(() => bucket.list({ limit: -1 })).to.throw(/finite non-negative integer/);
    expect(() => bucket.list({ pageSize: 0 })).to.throw(/between 1 and 1000/);
    expect(() => bucket.list({ pageSize: 1001 })).to.throw(/between 1 and 1000/);
    expect(() => bucket.list({ pageSize: 1.5 })).to.throw(/between 1 and 1000/);
    expect(calls).to.eql([]);
  });

  it('normalizes account IDs before deriving service identity', () => {
    const input = ` ${accountId.toUpperCase()} `;
    const service = R2.Service.create({
      accountId: input,
      credentials,
      transport: fakeTransport(),
    });

    expect(service.accountId).to.equal(accountId);
    expect(service.storageUrl).to.equal(`https://${accountId}.r2.cloudflarestorage.com`);
    expect(R2.Service.storageUrl(input)).to.equal(`https://${accountId}.r2.cloudflarestorage.com`);
  });

  it('rejects malformed account IDs before constructing buckets', () => {
    expect(() => R2.Service.create({ accountId: ' ', credentials })).to.throw(
      /accountId is required/,
    );
    expect(() => R2.Service.create({ accountId: 'abc123', credentials })).to.throw(/32 character/);
    expect(() => R2.Service.storageUrl('gggggggggggggggggggggggggggggggg')).to.throw(
      /32 character/,
    );
  });

  it('rejects blank credential fields before constructing buckets', () => {
    expect(() =>
      R2.Service.create({
        accountId,
        credentials: { ...credentials, accessKeyId: ' ' },
      })
    ).to.throw(/credentials.accessKeyId/);
    expect(() =>
      R2.Service.create({
        accountId,
        credentials: { ...credentials, secretAccessKey: ' ' },
      })
    ).to.throw(/credentials.secretAccessKey/);
    expect(() =>
      R2.Service.create({
        accountId,
        credentials: { ...credentials, sessionToken: ' ' },
      })
    ).to.throw(/credentials.sessionToken/);
  });

  it('rejects malformed write options before transport delegation', () => {
    const calls: unknown[] = [];
    const bucket = R2.Service.create({
      accountId,
      credentials,
      transport: fakeTransport(calls),
    }).bucket('assets');

    expect(() => bucket.write('index.html', 'hello', { size: 1.5 })).to.throw(
      /finite non-negative integer/,
    );
    expect(() => bucket.write('index.html', 'hello', { size: -1 })).to.throw(
      /finite non-negative integer/,
    );
    expect(calls).to.eql([]);
  });

  it('rejects provider-prefixed custom metadata before transport delegation', () => {
    const calls: unknown[] = [];
    const bucket = R2.Service.create({
      accountId,
      credentials,
      transport: fakeTransport(calls),
    }).bucket('assets');

    expect(() => bucket.write('index.html', 'hello', { custom: { 'x-amz-meta-owner': 'sys' } })).to
      .throw(/provider prefixes/);
    expect(calls).to.eql([]);
  });
});

import { describe, Err, expect, expectError, Is, it, type t, WebFixture } from '../../-test.ts';
import { R2 } from '../mod.ts';
import { createS3Transport } from '../u/u.transport.s3.ts';
import { accountId, credentials, r2FilesPolicy as policy } from './u.fixture.ts';

describe('R2 listing request boundary over the pinned S3 client', () => {
  it('refuses before the first fetch and preserves the original refusal', async () => {
    let calls = 0;
    using _mock = WebFixture.Fetch.mock(() => {
      calls++;
      return Promise.resolve(page([]));
    });
    const budget = guard(0);
    await expectFailure(() => collect(transport().list(budget)), budget.failure);
    expect(calls).to.equal(0);
  });

  it('bounds hidden empty/repeating-token pages rather than yielded objects', async () => {
    let calls = 0;
    using _mock = WebFixture.Fetch.mock(() => {
      calls++;
      return Promise.resolve(page([], calls < 5));
    });
    const budget = guard(2);
    await expectFailure(() => collect(transport().list({ ...budget, limit: 1 })), budget.failure);
    expect(calls).to.equal(2);
  });

  it('counts short pages separately even when pageSize equals the result cap', async () => {
    let calls = 0;
    using _mock = WebFixture.Fetch.mock((_input, init) => {
      calls++;
      expect(new Headers(init?.headers).get('authorization')).to.match(/^AWS4-HMAC-SHA256 /);
      return Promise.resolve(page([`file-${calls}`], calls < 3));
    });
    const budget = guard(1);
    await expectFailure(
      () => collect(transport().list({ ...budget, pageSize: 2, limit: 2 })),
      budget.failure,
    );
    expect(calls).to.equal(1);
  });

  it('keeps concurrent listing budgets isolated from each other and ordinary bucket calls', async () => {
    let calls = 0;
    using _mock = WebFixture.Fetch.mock(() => {
      calls++;
      return Promise.resolve(page([]));
    });
    const source = transport();
    const denied = guard(0);
    const results = await Promise.allSettled([
      collect(source.list(denied)),
      collect(source.list(guard(1))),
      collect(source.list()),
    ]);
    expect(results).to.eql([
      { status: 'rejected', reason: denied.failure },
      { status: 'fulfilled', value: [] },
      { status: 'fulfilled', value: [] },
    ]);
    expect(calls).to.equal(2);
  });

  it('preserves full exhaustion and closes iteration without fetching another page', async () => {
    let calls = 0;
    using _mock = WebFixture.Fetch.mock(() => {
      calls++;
      return Promise.resolve(page(['a', 'b'], true));
    });
    for await (const _object of transport().list(guard(1))) break;
    expect(calls).to.equal(1);
  });

  it('forwards and snapshots the hook at the public bucket boundary', async () => {
    let fetched = 0;
    using _mock = WebFixture.Fetch.mock(() => {
      fetched++;
      return Promise.resolve(page([]));
    });
    const bucket = R2.Service.create({ accountId, credentials }).bucket('assets');
    const budget = guard(0);
    const options = { beforeRequest: budget.beforeRequest };
    const objects = bucket.list(options);
    options.beforeRequest = () => undefined;
    await expectFailure(() => collect(objects), budget.failure);
    expect(fetched).to.equal(0);
    expect(() => bucket.list({ beforeRequest: false } as unknown as t.R2.Bucket.ListOptions))
      .to.throw(/beforeRequest/);
  });

  it('requires a budgeted terminal page for a Files index at exact object capacity', async () => {
    let calls = 0;
    using _mock = WebFixture.Fetch.mock(() => {
      calls++;
      return Promise.resolve(calls === 1 ? page(['a', 'b'], true) : page([]));
    });
    const bucket = R2.Service.create({ accountId, credentials }).bucket('assets');
    const enumeration: t.R2.Files.EnumerationLimits = {
      maxRequests: 1,
      maxObjects: 2,
      maxKeyBytes: 1024,
      maxEntries: 8,
      maxPathBytes: 1024,
    };
    const limited = R2.Files.create({ bucket, policy, enumeration });
    const error = await expectError(() =>
      limited.handlers['files:list']({ limit: 1 }, undefined as never)
    );
    expect(Err.std(error).name).to.equal('FilesR2Error.EnumerationLimit');
    expect(calls).to.equal(1);

    calls = 0;
    const admitted = R2.Files.create({
      bucket,
      policy,
      enumeration: { ...enumeration, maxRequests: 2 },
    });
    const result = await admitted.handlers['files:list']({ limit: 1 }, undefined as never);
    expect(result.entries.map((entry) => entry.path)).to.eql(['a']);
    expect(result.cursor).not.to.equal(undefined);
    expect(calls).to.equal(2);
  });

  it('zero result limit dispatches nothing and does not spend a budget slot', async () => {
    let calls = 0;
    using _mock = WebFixture.Fetch.mock(() => {
      calls++;
      return Promise.resolve(page([]));
    });
    const objects = await collect(transport().list({ ...guard(0), limit: 0 }));
    expect(Is.array(objects)).to.equal(true);
    expect(objects).to.eql([]);
    expect(calls).to.equal(0);
  });
});

/**
 * Helpers:
 */
function transport() {
  return createS3Transport({
    accountId,
    credentials,
    bucketName: 'assets',
    storageUrl: `https://${accountId}.r2.cloudflarestorage.com`,
  });
}

function page(keys: readonly string[], more = false) {
  const objects = keys.map((key) =>
    `<Contents><Key>${key}</Key><Size>1</Size><ETag>etag</ETag>` +
    '<LastModified>2026-06-01T00:00:00.000Z</LastModified></Contents>'
  ).join('');
  return new Response(
    `<ListBucketResult>${objects}<IsTruncated>${more}</IsTruncated>` +
      (more ? '<NextContinuationToken>again</NextContinuationToken>' : '') +
      '</ListBucketResult>',
  );
}

async function collect(objects: AsyncIterable<t.R2.ObjectInfo>) {
  const result: t.R2.ObjectInfo[] = [];
  for await (const object of objects) result.push(object);
  return result;
}

function guard(max: number) {
  const failure = new Error('listing budget exhausted');
  let attempts = 0;
  return {
    failure,
    beforeRequest() {
      if (++attempts > max) throw failure;
    },
  };
}

async function expectFailure(run: () => Promise<unknown>, expected: Error) {
  expect(await expectError(run)).to.equal(expected);
}

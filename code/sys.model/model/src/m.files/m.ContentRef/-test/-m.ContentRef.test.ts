import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { Hash } from '../common.ts';
import { ContentRef } from '../mod.ts';
import { Files } from '../../mod.ts';

const TEXT = 'Hello content ref.';
const BINARY = new TextEncoder().encode(TEXT);
const DIGEST = Hash.sha256(BINARY);

const urlRef: t.Files.ContentRef.Url = {
  kind: 'url',
  path: 'docs/readme.md',
  url: 'https://example.test/docs/readme.md',
  size: BINARY.byteLength,
  hash: DIGEST,
  encoding: 'utf8',
};

describe('Files.ContentRef', () => {
  it('API', () => {
    expect(Files.ContentRef).to.equal(ContentRef);
    expect(Object.keys(ContentRef).sort()).to.eql(['bytes', 'text']);
    expectTypeOf(ContentRef).toEqualTypeOf<t.Files.ContentRef.Lib>();
  });

  it('resolves URL refs to bytes and text through an injected fetch', async () => {
    const seen: t.FetchInput[] = [];
    const fetch: t.Fetch = async (input) => {
      seen.push(input);
      return new Response(BINARY);
    };

    const bytes = await Files.ContentRef.bytes(urlRef, { fetch });
    const text = await Files.ContentRef.text(urlRef, { fetch });

    expect(bytes).to.eql(BINARY);
    expect(text).to.eql(TEXT);
    expect(seen).to.eql([urlRef.url, urlRef.url]);
  });

  it('rejects unsupported content-ref kinds before using fetch', async () => {
    const ref: t.Files.ContentRef.Hash = {
      kind: 'hash',
      path: 'asset.txt',
      hash: DIGEST,
    };

    const error = await expectContentRefError(
      () => Files.ContentRef.bytes(ref, { fetch: unexpectedFetch }),
      'FilesContentRefError.Unsupported',
    );

    expect(error.message).to.eql(
      'Files.ContentRef.bytes: unsupported content ref kind "hash" for "asset.txt".',
    );
  });

  it('rejects non-OK HTTP responses with a Files-domain error', async () => {
    const error = await expectContentRefError(
      () =>
        Files.ContentRef.bytes(urlRef, {
          fetch: async () => new Response('missing', { status: 404, statusText: 'Not Found' }),
        }),
      'FilesContentRefError.HttpFailure',
    );

    expect(error.message).to.eql(
      'Files.ContentRef.bytes: HTTP 404 Not Found for "docs/readme.md".',
    );
  });

  it('verifies size and hash metadata by default', async () => {
    const wrongSize: t.Files.ContentRef.Url = { ...urlRef, size: BINARY.byteLength + 1 };
    const wrongHash: t.Files.ContentRef.Url = {
      ...urlRef,
      hash: `sha256-${'0'.repeat(64)}`,
    };

    const size = await expectContentRefError(
      () => Files.ContentRef.bytes(wrongSize, { fetch: okFetch }),
      'FilesContentRefError.SizeMismatch',
    );
    const hash = await expectContentRefError(
      () => Files.ContentRef.bytes(wrongHash, { fetch: okFetch }),
      'FilesContentRefError.HashMismatch',
    );

    expect(size.message).to.eql(
      'Files.ContentRef.bytes: size mismatch for "docs/readme.md"; expected 19 bytes, got 18 bytes.',
    );
    expect(hash.message).to.eql(
      `Files.ContentRef.bytes: hash mismatch for "docs/readme.md"; expected ${wrongHash.hash}, got ${DIGEST}.`,
    );
  });

  it('can disable integrity verification explicitly', async () => {
    const ref: t.Files.ContentRef.Url = {
      ...urlRef,
      size: 1,
      hash: `sha256-${'0'.repeat(64)}`,
    };

    expect(await Files.ContentRef.text(ref, { fetch: okFetch, verify: false })).to.eql(TEXT);
  });
});

async function okFetch(): Promise<Response> {
  return new Response(BINARY);
}

async function unexpectedFetch(): Promise<Response> {
  throw new Error('Fetch should not be called.');
}

async function expectContentRefError(
  fn: () => Promise<unknown>,
  name: t.Files.ContentRef.Error.Kind,
): Promise<Error> {
  try {
    await fn();
  } catch (cause) {
    expect(cause).to.be.instanceOf(Error);
    const error = cause as Error;
    expect(error.name).to.eql(name);
    expect(error.message.includes(urlRef.url)).to.eql(false);
    return error;
  }
  throw new Error(`Expected ${name}.`);
}

import { describe, expect, it } from '../../-test.ts';
import type { t } from '../common.ts';
import { fromS3Metadata, toObjectMeta, toS3Metadata } from '../u/u.metadata.ts';

describe('R2 substrate metadata adapter', () => {
  it('maps substrate object status to R2 object metadata', () => {
    const modifiedAt = new Date('2026-06-03T00:00:00.000Z');
    const metadata = toObjectMeta({
      type: 'Object',
      key: 'index.html',
      size: 12,
      etag: 'etag-1',
      lastModified: modifiedAt,
      versionId: 'version-1',
      metadata: { 'content-type': 'text/html' },
    } as t.S3ObjectStatus);

    expect(metadata).to.eql({
      key: 'index.html',
      size: 12,
      etag: 'etag-1',
      modifiedAt,
      version: 'version-1',
      metadata: { mediaType: 'text/html' },
    });
  });

  it('maps R2 write metadata to substrate metadata without dropping empty custom strings', () => {
    const metadata = toS3Metadata({
      mediaType: 'text/plain',
      cacheControl: 'max-age=60',
      contentEncoding: 'gzip',
      custom: { owner: 'sys', empty: '' },
    });

    expect(metadata).to.eql({
      'Content-Type': 'text/plain',
      'Cache-Control': 'max-age=60',
      'Content-Encoding': 'gzip',
      'x-amz-meta-owner': 'sys',
      'x-amz-meta-empty': '',
    });
  });

  it('maps substrate metadata back to R2 metadata case-insensitively', () => {
    const metadata = fromS3Metadata({
      'content-type': 'text/plain',
      'CACHE-CONTROL': 'max-age=60',
      'Content-Encoding': 'gzip',
      'X-Amz-Meta-Owner': 'sys',
      'x-amz-meta-empty': '',
    } as t.S3ObjectMetadata);

    expect(metadata).to.eql({
      mediaType: 'text/plain',
      cacheControl: 'max-age=60',
      contentEncoding: 'gzip',
      custom: { Owner: 'sys', empty: '' },
    });
  });
});

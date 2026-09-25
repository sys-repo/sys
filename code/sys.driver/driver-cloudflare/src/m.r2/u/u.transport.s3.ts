import { S3Client, type t } from './common.ts';
import { isNotFound } from './u.error.ts';
import { requestFailure } from './u.diagnostic.ts';
import { toObjectMeta, toS3Metadata } from './u.metadata.ts';

/** Private adapter from the R2-shaped bucket transport to signed S3-compatible HTTP. */
export function createS3Transport(context: t.R2.Bucket.TransportContext): t.R2.Bucket.Transport {
  const clientOptions = {
    endPoint: context.storageUrl,
    region: 'auto',
    accessKey: context.credentials.accessKeyId,
    secretKey: context.credentials.secretAccessKey,
    sessionToken: context.credentials.sessionToken,
    bucket: context.bucketName,
    pathStyle: true,
  };
  const client = new S3Client(clientOptions);

  const bucketName = context.bucketName;

  return {
    async stat(key) {
      try {
        const object = await client.statObject(key, { bucketName });
        return toObjectMeta(object);
      } catch (error) {
        if (isNotFound(error)) return undefined;
        throw requestFailure('stat', error);
      }
    },
    read: (key) => request('read', () => client.getObject(key, { bucketName })),
    presignGet(key, options) {
      const expirySeconds = options.expirySeconds;
      return request(
        'presign',
        () => client.getPresignedUrl('GET', key, { bucketName, expirySeconds }),
      );
    },
    async write(key, data, options) {
      const res = await request('write', () =>
        client.putObject(key, data, {
          bucketName,
          size: options?.size,
          metadata: toS3Metadata(options),
        }));
      return {
        etag: res.etag,
        version: res.versionId ?? undefined,
      };
    },
    remove: (key) => request('remove', () => client.deleteObject(key, { bucketName })),
    async *list(options) {
      if (options?.limit === 0) return;
      // A listing owns its client: concurrent operations cannot replace each other's guard.
      // The SDK's public request seam includes continuations hidden inside listObjects.
      const beforeRequest = options?.beforeRequest;
      const listing = new class extends S3Client {
        override makeRequest(...args: Parameters<S3Client['makeRequest']>) {
          beforeRequest?.();
          return request('list', () => super.makeRequest(...args));
        }
      }(clientOptions);
      const objects = listing.listObjects({
        bucketName,
        prefix: options?.prefix,
        maxResults: options?.limit,
        pageSize: options?.pageSize,
      });
      for await (const object of objects) {
        yield {
          key: object.key,
          size: object.size,
          etag: object.etag,
          modifiedAt: object.lastModified,
        };
      }
    },
  };
}

async function request<T>(operation: t.R2.Error.Operation, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    throw requestFailure(operation, error);
  }
}

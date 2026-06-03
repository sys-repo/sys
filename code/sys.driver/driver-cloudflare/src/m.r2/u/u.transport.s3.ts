import { S3Client, type t } from './common.ts';
import { isNotFound } from './u.error.ts';
import { toObjectMeta, toS3Metadata } from './u.metadata.ts';

/** Private adapter from the R2-shaped bucket transport to signed S3-compatible HTTP. */
export function createS3Transport(context: t.R2.Bucket.TransportContext): t.R2.Bucket.Transport {
  const client = new S3Client({
    endPoint: context.storageUrl,
    region: 'auto',
    accessKey: context.credentials.accessKeyId,
    secretKey: context.credentials.secretAccessKey,
    sessionToken: context.credentials.sessionToken,
    bucket: context.bucketName,
    pathStyle: true,
  });

  const bucketName = context.bucketName;

  return {
    async stat(key) {
      try {
        const object = await client.statObject(key, { bucketName });
        return toObjectMeta(object);
      } catch (error) {
        if (isNotFound(error)) return undefined;
        throw error;
      }
    },
    read(key) {
      return client.getObject(key, { bucketName });
    },
    async write(key, data, options) {
      const res = await client.putObject(key, data, {
        bucketName,
        size: options?.size,
        metadata: toS3Metadata(options),
      });
      return {
        etag: res.etag,
        version: res.versionId ?? undefined,
      };
    },
    remove(key) {
      return client.deleteObject(key, { bucketName });
    },
    async *list(options) {
      if (options?.limit === 0) return;
      const objects = client.listObjects({
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

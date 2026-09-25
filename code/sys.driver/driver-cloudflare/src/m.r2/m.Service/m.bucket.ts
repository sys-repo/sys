import { Is, type t } from './common.ts';
import { toPresignKey, toPresignOptions } from './u.presign.ts';
import {
  requireText,
  toListOptions,
  toObjectKey,
  toReadOrigin,
  toWriteOptions,
} from './u.validate.ts';

type CreateBucketArgs = {
  readonly accountId: string;
  readonly storageUrl: string;
  readonly credentials: t.R2.Credentials;
  readonly transportFactory: t.R2.Bucket.TransportFactory;
  readonly name: string;
  readonly options?: t.R2.Bucket.Options;
};

/** Create an R2 bucket handle. */
export function createBucket(args: CreateBucketArgs): t.R2.Bucket {
  const name = requireText(args.name, 'bucket name');
  const readOrigin = toReadOrigin(args.options?.readOrigin);
  const transport = args.transportFactory({
    accountId: args.accountId,
    storageUrl: args.storageUrl,
    credentials: args.credentials,
    bucketName: name,
  });

  const bucket: t.R2.Bucket = {
    name,
    readOrigin,
    stat: (key) => transport.stat(toObjectKey(key)),
    read: (key) => transport.read(toObjectKey(key)),
    write(key, data, options) {
      const objectKey = toObjectKey(key);
      const writeOptions = toWriteOptions(options);
      return transport.write(objectKey, data, writeOptions);
    },
    remove: (key) => transport.remove(toObjectKey(key)),
    list: (options) => transport.list(toListOptions(options)),
  };
  const presignGet = transport.presignGet;
  if (Is.func(presignGet)) {
    bucket.presignGet = (key, options) => {
      const objectKey = toPresignKey(key);
      const signingOptions = toPresignOptions(options);
      return presignGet.call(transport, objectKey, signingOptions);
    };
  }
  return Object.freeze(bucket);
}

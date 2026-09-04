import type { t } from './common.ts';
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
    stat(key) {
      return transport.stat(toObjectKey(key));
    },
    read(key) {
      return transport.read(toObjectKey(key));
    },
    write(key, data, options) {
      return transport.write(toObjectKey(key), data, toWriteOptions(options));
    },
    remove(key) {
      return transport.remove(toObjectKey(key));
    },
    list(options) {
      return transport.list(toListOptions(options));
    },
  };
  return Object.freeze(bucket);
}

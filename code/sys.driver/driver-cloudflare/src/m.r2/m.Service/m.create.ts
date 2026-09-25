import type { t } from './common.ts';
import { createS3Transport } from '../u/u.transport.s3.ts';
import { createBucket } from './m.bucket.ts';
import { freezeCredentials, toAccountId } from './u.validate.ts';

/** Create an R2 service handle. */
export function create(options: t.R2.Service.CreateOptions): t.R2.Service {
  const accountId = toAccountId(options.accountId);
  const url = storageUrl(accountId);
  const credentials = freezeCredentials(options.credentials);
  const transportFactory = options.transport ?? createS3Transport;

  const service: t.R2.Service = {
    accountId,
    storageUrl: url,
    bucket(name, options) {
      return createBucket({
        accountId,
        storageUrl: url,
        credentials,
        transportFactory,
        name,
        options,
      });
    },
  };
  return Object.freeze(service);
}

/** R2 signed HTTP storage URL for an account. */
export function storageUrl(accountId: string): string {
  const id = toAccountId(accountId);
  return `https://${id}.r2.cloudflarestorage.com`;
}

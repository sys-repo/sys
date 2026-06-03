import { describe, expect, it } from '../../-test.ts';
import { createS3Transport } from '../u/u.transport.s3.ts';
import { accountId, credentials } from './u.fixture.ts';

describe('R2 S3-compatible transport adapter', () => {
  it('treats list limit 0 as an empty result without touching the network', async () => {
    const transport = createS3Transport({
      accountId,
      credentials,
      bucketName: 'assets',
      storageUrl: `https://${accountId}.r2.cloudflarestorage.com`,
    });

    const objects = [];
    for await (const object of transport.list({ limit: 0 })) objects.push(object);

    expect(objects).to.eql([]);
  });
});

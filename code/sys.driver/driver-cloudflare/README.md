# @sys/driver-cloudflare

Cloudflare runtime integration.

```ts
import { R2 } from 'jsr:@sys/driver-cloudflare/r2';

const service = R2.Service.create({
  accountId: '<account-id>',
  credentials: {
    accessKeyId: '<access-key-id>',
    secretAccessKey: '<secret-access-key>',
  },
});

const bucket = service.bucket('media');
await bucket.write('hello.txt', 'Hello from R2.', { mediaType: 'text/plain' });
```

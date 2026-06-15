# Cryptographic Helpers

Helpers for working with cryptographic functions.

```ts
import { Hash } from '@sys/crypto/hash';

const digest = Hash.sha256('hello');
const short = Hash.shorten(digest, [8, 6]);
```


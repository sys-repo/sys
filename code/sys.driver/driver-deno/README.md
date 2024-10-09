# Deno Cloud Driver
Tools for working with the [Deno Runtime](https://docs.deno.com/runtime/) and the [Deno Cloud](https://deno.com/deploy):  Deploy™️  |  Subhosting.™️


### References

- [Deno: Deploy™️](https://deno.com/deploy)
- [Deno: Subhosting Docs](https://docs.deno.com/subhosting/manual)
- [Privy: Verifying JWT authToken](https://docs.privy.io/guide/server/authorization/verification#verifying-the-user-s-access-token)


### .env
Ensure you have a `.env` file or have the following `ENV_VARS` available to the process.

```bash
# Loaded from: src/env.ts

# Deno: Subhosting → Settings → Access Tokens
#       https://dash.deno.com/subhosting
DENO_SUBHOSTING_ACCESS_TOKEN="****"
DENO_SUBHOSTING_DEPLOY_ORG_ID="****"

# Privy: Dashboard → Settings → Basics
#        https://dashboard.privy.io
PRIVY_APP_ID="****"
PRIVY_APP_SECRET="****"
```


### Example

```ts
import { Pkg } from 'jsr:@sys/driver-deno';
import { DenoCloud, Server } from 'jsr:@sys/driver-deno/server';

const app = DenoCloud.server({ env });
const options = Server.options(8080, Pkg)
Deno.serve(options, app.fetch);
```



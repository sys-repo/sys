# Stripe sample

From `code/sys/cell`, run `deno task sample:stripe`. The proxy serves `127.0.0.1:8080` only after
both the static view (`4040`) and Stripe fixture (`9090`) have started. Each listener requires its
configured port. If an upstream port is occupied, startup fails without opening the proxy.

To verify startup and routing without Stripe credentials, run `deno task test:sample:stripe`. It
copies the sample into a temporary directory and uses test-owned loopback ports. Add `-- --fixed` to
use the sample's configured ports when all three are free.

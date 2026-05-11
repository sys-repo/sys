# Prompt: create a Stripe-dev Cell

Status: implemented; retire after recording completed outcome.

This prompt produced the Stripe-dev baseline sample now kept at:

```text
code/sys/cell/-sample/cell.stripe
```

The sample is now the source of truth for this cowpath. It contains:

- microkernel `-config/@sys.cell/cell.yaml`
- static view service config at `-config/@sys.http/static.view.yaml`
- Stripe fixture service config at `-config/@sys.driver-stripe/fixture.yaml`
- proxy service config at `-config/@sys.http/proxy.yaml`
- pull config at `-config/@sys.tools.pull/view.yaml`
- local hello view at `view/hello-world/`
- module-level sample runner via `deno task sample:stripe` / `deno task start`

Current runtime services:

- `ui:static:views` → `@sys/http/server/static` / `HttpStatic` on `127.0.0.1:4040`
- `stripe:dev:fixture` → `@sys/driver-stripe/server/fixture` / `StripeFixture` on `127.0.0.1:9090`
- `cell:proxy` → `@sys/http/server/proxy` / `HttpProxy` on `127.0.0.1:8080`

Current proxy routes:

- `/` → hello view
- `/payments/` → pulled Stripe developer view
- `/view/` → static view-folder root
- `/-/stripe/` → Stripe fixture

The original prompt is no longer authoritative because it predates the microkernel descriptor and
asked for stale details such as a per-sample start script, `Cell topology` language, and an agent
help topic. Retire this file after committing this completed record.

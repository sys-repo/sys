# Prompt: create a Stripe-dev Cell

Use @sys/cell to make this folder a small Stripe-dev Cell.

Start by reading the public @sys/cell CLI help and the agent help topic. Initialize the folder if
needed.

Create the minimal plain-file shape for:

- a `data/` DSL root
- a local hello view at `view/hello-world`
- a pulled Stripe developer view under `view/.pulled/driver.stripe`
- Cell topology in `-config/@sys.cell/cell.yaml`
- separate pull, static HTTP, proxy HTTP, Stripe fixture, and serve-helper config files under
  `-config/`
- a small Deno task surface for humans: at minimum `deno task start` backed by a simple
  `script.start.ts` file

Use these runtime pieces:

- static view service: `@sys/http/server/static`, `HttpStatic`, `127.0.0.1:4040`
- Stripe fixture service: `@sys/driver-stripe/server/fixture`, `StripeFixture`, `127.0.0.1:9090`
- proxy app: `@sys/http/server/proxy`, `HttpProxy`, `127.0.0.1:8080`

Proxy `/` to the hello view, `/payments/` to the pulled Stripe view, `/view/` to the raw view
folder, and `/-/stripe/` to the Stripe fixture.

Use the Stripe view dist at `https://fs.db.team/driver.stripe/dist.json`, materialize it with the
`@sys/tools/pull` CLI, and inspect that CLI's help if needed.

Keep ownership clean: `cell.yaml` owns topology only; pull config owns materialization; service
configs own service details; the start script only starts the already-declared Cell runtime. Do not
add secrets or turn `cell.yaml` into a mega-config.

Make startup humane. Do not end with an inline `deno eval`, heredoc, or pasted TypeScript snippet.
Create the small start script the folder needs and wire it through `deno.json`. The script should
load the current folder as a Cell, start the declared runtime, print the proxy URL, keep the process
alive, and close cleanly on interrupt. Verify the Cell can be loaded, then end with the exact
command a human should run from this folder:

```sh
deno task start
```

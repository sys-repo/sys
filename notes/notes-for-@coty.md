# Notes

- ref: [discord conversation](https://discord.com/channels/684898665143206084/684898665151594506/1288966913187250349) with @coty


## Context

- Monorepo is defined in the root `/deno.json` file, see `[workspace]` array.
  
- Design Goal: have pure deno ESM modules that cross-referenes each other within the mono-repo, some of which expose `<JSX>` components, be `import`-able into a module that uses a simple Vite configuration as the development and production JS bundler.
  
- The cross-module referencing from within the mono-repo can be demonstrated via the `deno task test`.  Deno works cleanly


## Running

To see the vite instance "working":

```bash
cd code/sys.ui/ui-react
deno task dev
```


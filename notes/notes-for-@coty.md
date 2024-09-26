# Notes

- ref: [discord conversation](https://discord.com/channels/684898665143206084/684898665151594506/1288966913187250349) with @coty


## Context

- Monorepo is defined in the root `/deno.json` file, see `[workspace]` array.
  
- Design Goal: have pure deno ESM modules that cross-referenes each other within the mono-repo, some of which expose `<JSX>` components, be `import`-able into a module that uses a simple Vite configuration as the development and production JS bundler.
  
- The cross-module referencing from within the mono-repo can be demonstrated via the `deno task test`.  Deno works cleanly


## Running
To see the vite instance in a "working" state, run:

```bash
cd code/sys.ui/ui-react
deno task dev

↓

  VITE v5.4.7  ready in 127 ms

  ➜  Local:   http://localhost:1234/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

This will start a working Vite endpoint on `http://localhost:1234/` rendering `./src/ui/App.tsx`.  In that file, there are commented out imports, that when you uncomment them causes the cross-module import error.

```ts
import { join } from 'jsr:@std/path'; // ← import module from JSR
import { Path } from '@sys/std'; //      ← importing module from self/mono-repo (pre JSR)

/**
 * uncomment these lines to cause the imports to fail in Vite.
 */
// console.log('join', join);
// console.log('Path', Path);
```

## Reflection

Some version of this "pure deno modules in a deno monorepo" crossed with "vite bundling" would be a killer unlock for having the massive population of Vite developers and projects switch over to Deno as the better underlying JS runtime to move forward with.
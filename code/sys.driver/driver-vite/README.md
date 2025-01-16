# Vite Driver

Tools for working with [Vite](https://vitejs.dev/) as an ESM bundler and dev-harness within [Deno](https://docs.deno.com/) workspaces.

<p>&nbsp;<p>

NB: <UI Framework™️> agnostic.

---

### References

- [JSR Docs: Vite](https://jsr.io/docs/with/vite) (Build Tool)
- [Deno Docs: Workspace](https://docs.deno.com/runtime/fundamentals/workspaces/)
- [jsr:@sys/driver-deno](https://jsr.io/@sys/driver-deno) 


<p>&nbsp;<p>

---

### Usage (Command Line)

Start the live (HMR) development server.
```bash
deno run -RWNE --allow-run --allow-ffi jsr:@sys/driver-vite/dev
```

Build the production `./dist` bundle.
```bash
deno run -RWE --allow-run --allow-ffi jsr:@sys/driver-vite/build
```

Serve the built distribution folder (`./dist`) via static HTTP server.
```bash
deno run -RNE --allow-run --allow-ffi jsr:@sys/driver-vite/serve
```


<p>&nbsp;<p>

### Runtime ← Bundler

![diagram](https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/a720851d-97c8-4feb-439c-6e4a41be6b00/original)



## Configuration

Within the `vite.config.ts` file in the root of your module folder:

```ts
import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';
import reactPlugin from '@vitejs/plugin-react-swc';

export default defineConfig(() => {
  const workspace = Vite.Plugin.workspace();
  return { plugins: [reactPlugin(), workspace] };
});
```
 
Optionally, you can filter the workspace modules that are exposed
to the Vite bundle:
 
```ts
export default defineConfig(() => {
  const workspace = Vite.Plugin.workspace({ filter: (e) => e.subpath.startsWith('/client') });
  return { plugins: [reactPlugin(), workspace] };
});
```
 
Along with the option to manulate the configuration further after the initial
baseline settings have initialized, using the `mutate` plugin callback.

```ts
export default defineConfig(() => {
  const workspace = Vite.Plugin.workspace({ 
    mutate(e) {
      console.info(c.dim(`\n👋 (callback inside plugin)`));
      if (e.ws) console.info(e.ws.toString({ pad: true }));
    },
  });
  return { plugins: [reactPlugin(), workspace] };
});
```

See [basic](./vite.config.-sample.simple.ts) and [custom](./vite.config.-sample.custom.ts) `vite.config.ts` sample files.

# Vite Driver

Tools for working with [Vite](https://vitejs.dev/) as an ESM bundler and design-time dev harness 
within a multi-module [Deno](https://docs.deno.com/) workspaces.

<p>&nbsp;<p>

NB: <UI Framework™️> agnostic.

---

### References

- [JSR Docs: Vite](https://jsr.io/docs/with/vite) (Build Tool).
- [Deno Docs: Workspace](https://docs.deno.com/runtime/fundamentals/workspaces/).
- [jsr:@sys/driver-deno](https://jsr.io/@sys/driver-deno) ← for workspace import/dependency graph.


<p>&nbsp;<p>

---

### Initialize (New Instance): 🧫
Scaffold a new project within the current-working-directory (`cwd`) on the local file-system:

```bash
deno run -A jsr:@sys/driver-vite/init
```

<p>&nbsp;<p>

---

<p>&nbsp;<p>

### Runtime ← Bundler

![diagram](https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/a720851d-97c8-4feb-439c-6e4a41be6b00/original)


### Usage (Command Line)

```bash
deno run -A jsr:@sys/driver-vite/init
```


The `/init` command initializes a project with a `deno.json` file providing the
the common set of API "commands" (aka. "tasks") via the `/main` entry-point, eg:

```bash
jsr:@sys/driver-vite@<version>/main --cmd=dev
jsr:@sys/driver-vite@<version>/main --cmd=build
jsr:@sys/driver-vite@<version>/main --cmd=serve

# (etc)...
```

Call up "Help" to see available commands → `deno task help`:

```bash
Usage: deno task [COMMAND]

  deno task dev       Run the development server.                        
  deno task build     Transpile to production bundle.                    
  deno task serve     Run a local HTTP server with the production bundle.
                                                                         
  deno task upgrade   Upgrade to latest version.                         
  deno task backup    Take a snapshot of the project.                    
  deno task clean     Delete temporary files.                            
  deno task help      Show help.
```


<p>&nbsp;<p>




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

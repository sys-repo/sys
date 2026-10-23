# @sys/driver-monaco

React adapter and driver utilities for [Monaco Editor](https://github.com/microsoft/monaco-editor),
including YAML and CRDT integrations.

## Editor

```tsx
import { Monaco } from '@sys/driver-monaco';

<Monaco.Editor style={{ Absolute: 0 }} theme={'Dark'} />;
```

## Runtime assets

`Monaco.loader` is the upstream `@monaco-editor/react` loader singleton. Monaco's runtime
initializes on first use; configure the loader before the first editor mounts or `loader.init()`
runs.

The upstream loader uses [jsDelivr](https://www.jsdelivr.com/) by default. To self-host Monaco,
deploy a complete `monaco-editor/min/vs` tree and configure its same-origin URL once:

```ts
import { Monaco } from '@sys/driver-monaco';

const vs = new URL('./vs', document.baseURI).href;
Monaco.loader.config({ paths: { vs } });
```

Vite applications can apply the package's reusable integration:

```ts
import { MonacoVite } from '@sys/driver-monaco/vite';
import { Vite } from '@sys/driver-vite';

export default Vite.Config.define(() => Vite.Config.app({ vitePlugins: [MonacoVite.plugin()] }));
```

The plugin has one fixed deployment contract. It serves the pinned runtime from the app-relative
`vs` path during development and emits the complete tree to the build output's `vs` directory
(`dist/vs` under the package's default output). It carries Monaco's exact `LICENSE` and
`ThirdPartyNotices.txt`, rejects unsupported source-tree entries, and fails unless the emitted
path-to-hash map exactly matches the installed dependency. Use a relative Vite base when one
artifact must run both at an origin root and beneath a nested application path.

Treat the application and `vs` tree as one release. Prefer an immutable version- or digest-scoped
parent URL. If `vs` is unversioned, deploy it atomically with the application and serve `vs/**` with
revalidation (`Cache-Control: no-cache`); do not apply long-lived immutable caching to stable names
such as `loader.js` or `editor/editor.main.js`.

The package release proof is repeatable:

```sh
deno task smoke:browser
```

It runs the TypeScript and JSON language workers in Vite development, root production, and nested
`/tools/monaco/` production, while rejecting browser errors, failed same-origin requests, and
third-party runtime resources.

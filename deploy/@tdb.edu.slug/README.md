# @tdb/edu-slug
Slug concept-player training system.

- [socialleancanvas.com](https://socialleancanvas.com)
- [sys.education](https://sys.education)


<p>&nbsp;</p>


## Bundle Hook
In the `jsr:@sys/tools crdt` command, generate the `hook.ts` file and expose a "**bundler plugin**". Default plugin available from the `Bundler` export within the content/compiler tools:

```ts
import type { t } from 'jsr:@sys/tools';
import { c } from 'jsr:@sys/cli';

export const plugins: t.CrdtTool.Hook.Plugin[] = [
  {
    id: 'bundle:slug',
    title: `bundle ${c.gray(`[ ${c.cyan(`@tdb/edu-slug`)} ]`)}`,
    async run(e) {
      const { cmd, cwd } = e;
      const { Bundler } = await import('@tdb/edu-slug/compiler');
      return await Bundler.run({ cwd, cmd, interactive: true });
    },
  },
];
```

<p>&nbsp;</p>

which will be exposed in UI within `jsr:@sys/tools crdt` tool, via an interactive CLI menu:

<p>&nbsp;</p>

```bash
system/crdt:tools
❯  - bundle [ @tdb/edu-slug ]
   documents (2)
   repository
  (exit)
```

<p>&nbsp;</p>


## Document Graph Lint Hook
In the `jsr:@sys/tools crdt` command, generate the `hook.doc.ts` file and expose a
document-graph plugin for linting the currently selected DAG.

```ts
import type { t } from 'jsr:@sys/tools';
import { c } from 'jsr:@sys/cli';
import { env } from 'jsr:@sys/tools/env';

await env();

export const onWalk: t.CrdtTool.Doc.Graph.WalkHook = async (e) => {
  if (e.is.root) {
    e.log(`hook: from root document | ${c.green(e.id)}`);
  }
};

export const plugins: readonly t.CrdtTool.Doc.Graph.Plugin[] = [
  {
    id: 'lint:program:slugs',
    title: `lint ${c.dim(`[ ${c.cyan('@tdb/edu-slug')} ]`)}`,
    async run(args) {
      const { Linter } = await import('jsr:@tdb/edu-slug/compiler');
      await Linter.cmd({
        cmd: args.cmd,
        dag: args.dag,
        docpath: args.docpath,
        cwd: args.cwd,
        interactive: true,
      });

      return { kind: 'stay' };
    },
  },
];
```

This plugin appears from the document graph menu, not the root `system/crdt:tools`
menu, because it requires the current DAG and selected `docpath`.

<p>&nbsp;</p>


## Deployment
Bundle folder layout:
```
    staging.cdn
    └── slc
        ├── default   (manifests, json, images, etc.)
        └── video     (large streaming media)
```

<p>&nbsp;</p>

Hostname layout:
```
            slc.db.team
        cdn.slc.db.team            ← staging.cdn/slc/default/*
  video.cdn.slc.db.team            ← staging.cdn/slc/video/*
0.video.cdn.slc.db.team            ← staging.cdn/slc/video/<shard>.shard - { shards: 64 } | 0..63

            |

            socialleancanvas.com
        cdn.socialleancanvas.com
  video.cdn.socialleancanvas.com
```

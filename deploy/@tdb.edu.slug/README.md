# Slug System (sys.education)
Slug concept-player training system.

- [socialleancanvas.com](https://socialleancanvas.com)
- [sys.education](https://sys.education)


<p>&nbsp;</p>


## Bundle Hook
In `hookt.ts` file via `jsr:@sys/tools/crdt` add the bundler plugin:

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

Will produce the menu in `jsr:@sys/tools/crdt`:

```bash
system/crdt:tools v0.0.224 (Ctrl-C to exit)
?
❯  - bundle [ @tdb/edu-slug ]
   documents (2)
   repository
  (exit)
```

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


            socialleancanvas.com
        cdn.socialleancanvas.com
  video.cdn.socialleancanvas.com
```

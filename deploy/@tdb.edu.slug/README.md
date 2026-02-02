# Slug System (sys.education)
Slug concept-player training system.

- [socialleancanvas.com](https://socialleancanvas.com)
- [sys.education](https://sys.education)


<p>&nbsp;</p>


## Bundle Hook
In `hookt.ts` file via `@sys/tools/crdt` add the bundler plugin:

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


## Deployment
Bundle folder layout:

```
  staging.cdn
  └── slc
      ├── default   (images, manifests, json, etc.)
      └── video     (large streaming media)
```

DNS layout:
```
            slc.db.team
        cdn.slc.db.team
  video.cdn.slc.db.team
```

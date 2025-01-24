# JSR - the “Javascript Registry”
Tools for working with the [JSR](https://jsr.io/docs/api) module 
registry ([ESM](https://ecma-international.org/publications-and-standards/standards/ecma-262/)).

https://jsr.io/docs/api

### Example
Retrieve version information about a module:
```ts
import { Jsr } from 'jsr:@sys/jsr';

const res = await Jsr.Fetch.Pkg.versions("@sys/std");
const data = res.data; 
//    ↑  { scope: "sys", name: "std", latest: "0.0.42", versions: [Getter] }
```

Sort versions:
```ts
import { Semver } from 'jsr:@sys/std';

const res = await Jsr.Fetch.Pkg.versions("@sys/std");
const versions = Semver.sort(Object.keys(res.data?.versions ?? []));
```

Retrieve information about a specific module version:
```ts
const res = await Jsr.Fetch.Pkg.info('@sys/std', '0.0.42');

// res.data:
//  -  pkg
//  -  manifest
//  -  exports
//  -  graph (moduleGraph1, moduleGraph2)
```

Pull the source-code of a specific module/version and save it to the local file-system.

Note: this is a "secure fetch" operation. The JSR manifest checksums (sha256) are compared with
the pulled source-file content, and matched before writing to the local file-system.

```ts
import { Jsr } from 'jsr:@sys/jsr/server';

const { manifest } = await Jsr.Manifest.fetch('@sys/std', '0.0.42');
if (manifest) {
  /**
   * Options:
   * - ƒn(filter)
   * - write: (default string: directory to save to).
   */
  const res = await manifest.pull('./my-modules-dir'); 
  //                                     ↑
  //                          saves to dir/@<scope>/<module-name>
  console.log(res);
}

```

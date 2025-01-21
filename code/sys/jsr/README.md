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


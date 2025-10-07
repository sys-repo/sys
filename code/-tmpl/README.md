# System Templates
Common system templates invoked from the command line.

- Powered by [`@sys/tmpl-engine`](https://jsr.io/@sys/tmpl-engine).
- Provides an index of core **system** templates.
- Delegates to the template CLIs exposed by `@sys/*/tmpl` entry points.


### Usage
From the command line:

```bash
deno run -RWE jsr:@sys/tmpl
deno run -RWE jsr:@sys/tmpl --dryRun --force
```

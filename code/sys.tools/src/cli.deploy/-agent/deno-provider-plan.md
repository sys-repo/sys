# cli.deploy — Deno Integration Note

## 1. What We Learned

- `@sys/driver-deno` is the real owner of Deno Deploy staging and deploy truth.
- `@sys/tools/deploy` should remain a thin integration layer over that driver.
- The top-level operator model in `cli.deploy` is still correct:
  - `stage`
  - `push`
- For Deno, those are independent operator actions over one shared artifact path.
- The correct authored Deno endpoint shape is:
  - `source.dir` = source base
  - `mappings[*].dir.source` = selected package target under that base
  - `staging.dir` = caller-owned Deno stage root
- Deno `probe` is env/config readiness, not CLI/PATH discovery.

## 2. Gotchas And Why We Got It Wrong

- We first wired Deno `push` to `DenoDeploy.pipeline(...)`.
- That made Deno `push` work end-to-end, but it re-staged internally.
- We later wired Deno `stage` to `DenoDeploy.stage(...)`.
- That left us with two valid paths that did not join:
  - `stage` produced a real staged root
  - `push` ignored it and re-staged from source
- That was the core mistake.
- The earlier shortcut also collapsed the endpoint model too far:
  - treated `source.dir` as the package itself
  - instead of treating `source.dir + mappings` as the authored package selection mechanism
- Another friction point:
  - `cli.deploy` initially rejected absolute `staging.dir`
  - but Deno driver staging explicitly supports caller-owned absolute roots
- Another friction point:
  - provider env lookup initially used raw `Deno.env.get(...)`
  - but the repo uses upward `.env` resolution

## 3. Where We Need To Go

- Keep `cli.deploy` Deno integration thin.
- Do not add more Deno-specific staging/deploy logic to `@sys/tools/deploy`.
- The next real move belongs in `@sys/driver-deno`.

### Required driver improvement

- Add a clean public seam for:
  - deploying an already-staged Deno artifact
- That seam should let `cli.deploy` do:
  - `stage` -> `DenoDeploy.stage(...)`
  - `push` -> deploy the prior staged artifact
- `push` must not re-stage.

### Why this is the right move

- it preserves the independent operator model
- it keeps the driver as the artifact-truth owner
- it simplifies the tools adapter instead of growing it
- it lets `cli.deploy` become a straightforward integration over expressive driver APIs

## 4. Final Review — Why This Is Good

- The current work was not wasted.
- It exposed the exact missing driver seam.
- That is good integration signal, not random churn.
- The stage/push split is now better understood:
  - not one combined hidden path
  - two explicit operator actions over one artifact
- The right architecture is clearer now:
  - template/repo config owns authored intent
  - `@sys/tools/deploy` owns operator UX
  - `@sys/driver-deno` owns platform truth
- The next cleanup should therefore be sharper:
  - improve `driver-deno`
  - then simplify `cli.deploy` around that truth

## Current State

- Deno endpoint schema exists in `cli.deploy`
- Deno probe exists and uses upward env loading
- Deno stage now maps to `DenoDeploy.stage(...)`
- Deno push still uses `DenoDeploy.pipeline(...)`
- Therefore:
  - Deno stage is now real
  - Deno push is real
  - but Deno `stage + push` is still not one shared artifact path yet

## Next Commit

~~~text
feat(driver-deno): support deploy execution from an existing staged artifact
~~~

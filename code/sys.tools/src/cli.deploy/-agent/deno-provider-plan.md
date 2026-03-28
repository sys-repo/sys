# cli.deploy — Deno Integration Plan

## Summary

- The current `cli.deploy` Deno work produced real signal.
- The YAML/config direction is good.
- The integration mistake is now clear:
  - `stage` is real
  - `push` is real
  - but `push` still re-stages via `DenoDeploy.pipeline(...)`
- The next move is not more `@sys/tools` glue.
- The next move is a tighter `@sys/driver-deno` seam so `stage` and `push` remain independent actions over one shared staged artifact.

## 1. Pre-clean

- Keep the endpoint YAML scaffold improvements.
- Preserve the authored Deno endpoint shape proven by the working sample:
  - `provider`
  - `source.dir`
  - `staging.dir`
  - `mappings`
- Replace copy-oriented mapping nouns with provider-neutral staging nouns.
- Keep the endpoint scaffold universal; do not split into Deno-only and Orbiter-only templates.

### Commit spine

~~~text
refactor(cli.deploy): tighten the endpoint yaml scaffold and placeholder examples
~~~

~~~text
refactor(cli.deploy): replace copy-oriented mapping modes with provider-neutral staging nouns
~~~

## 2. Tighten The Deno Driver Seam

- `@sys/driver-deno` already owns the real Deno Deploy truth.
- `@sys/tools/deploy` should not duplicate that logic.
- Add a public driver seam to deploy an already-staged artifact without re-staging.
- Keep `pipeline()` as the combined convenience path.
- Do not force Orbiter symmetry unless the shared seam is clearly earned after the Deno work lands.

### Required outcome

- `stage` -> `DenoDeploy.stage(...)`
- `push` -> deploy the prior staged artifact
- no re-stage

### Commit spine

~~~text
feat(driver-deno): let deploy consume an existing staged root without re-staging
~~~

## 3. Rebuild The Tools Integration

- Rebuild the Deno adapter over the improved driver seam.
- Keep `stage` and `push` as independent operator actions.
- Resolve the Deno package target from:
  - `source.dir + mappings`
- Use `staging.dir` as the caller-owned stage root.
- Make `push` consume the prior staged artifact instead of calling `pipeline()`.
- Reuse driver progress/listener output instead of local replica spinners and status copy.

### Commit spine

~~~text
refactor(cli.deploy): make deno stage and push share one staged artifact path
~~~

~~~text
refactor(cli.deploy): reuse driver-deno progress listeners for deno stage and push
~~~

## 4. Cleanup

- Remove misleading UI assumptions left from the partial integration.
- Reduce the noticeable first-render pause in `@sys/tools/deploy`.
- Do final naming/DX tightening after the real stage/push artifact path is proven.

### Commit spine

~~~text
refactor(cli.deploy): reduce the initial deploy menu render pause
~~~

## What We Learned

- `@sys/driver-deno` is the real owner of Deno Deploy staging and deploy truth.
- `@sys/tools/deploy` should remain a thin integration layer over that driver.
- The top-level operator model is still correct:
  - `stage`
  - `push`
- For Deno, those are independent operator actions over one shared artifact path.
- The correct authored Deno endpoint shape is:
  - `provider` = remote target
  - `source.dir` = source base
  - `staging.dir` = caller-owned stage root
  - `mappings[*].dir.source` = selected package target under that base

## Gotchas

- We first wired Deno `push` to `DenoDeploy.pipeline(...)`.
- That made Deno `push` work, but it re-staged internally.
- We later wired Deno `stage` to `DenoDeploy.stage(...)`.
- That left two valid paths that did not join.
- We also collapsed the endpoint model too far by treating `source.dir` as the package itself instead of using `source.dir + mappings`.
- We initially rejected absolute `staging.dir`, even though Deno driver staging supports caller-owned absolute roots.
- We initially used raw `Deno.env.get(...)` instead of upward `.env` resolution.

## Why This Plan Is Good

- The current work was not wasted.
- It exposed the exact missing driver seam.
- That is good integration signal, not random churn.
- The architecture is now clearer:
  - template/repo config owns authored intent
  - `@sys/tools/deploy` owns operator UX
  - `@sys/driver-deno` owns platform truth
- The next cleanup is therefore sharp:
  - improve `driver-deno`
  - then simplify `cli.deploy` around that truth

## Snapshot Commands

```bash
git stash push -u -m "checkpoint(cli.deploy): deno integration signal before staged-artifact cleanup"
git stash list
git stash show --stat stash@{0}

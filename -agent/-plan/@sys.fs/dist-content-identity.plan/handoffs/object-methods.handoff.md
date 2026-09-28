# Deferred style pass: object-literal arrow properties

## Status and ordering

This is a candidate inventory for the main implementation thread, not an applied refactor, a blind
review report, or a correctness verdict. The human requested scanning now and folding findings into
implementation later, after intervening review/adjudication work as appropriate.

- Repository: `/Users/phil/code/org.sys/sys`.
- Observed HEAD: `8d97fe4088bed6764e804424b767b089ffb13cf3`.
- Subject: modified/staged and relevant untracked authored TypeScript/TSX under `code/` and
  `deploy/`.
- Discovery: read-only Git path discovery and single-/multiline searches for arrow-valued
  properties, followed by source reads of candidate contexts and representative bodies.
- Result: 23 candidate-bearing files below. Some surrounding candidate occurrences were located by
  search rather than individually audited. This is not an exhaustive AST analysis or proof that
  every listed arrow can safely change.
- HEAD does not identify the dirty bytes. Other implementation work was active; no stable entry/exit
  source snapshot or clean review verdict is claimed.
- No source/test/config changes or test executions were made for this scan. Only this handoff was
  authored. Plans, generated artifacts, recovery copies, and unrelated clean files were not targets.

**Reopen and rescan before applying.** Line numbers are navigation hints, not patch coordinates. Use
file paths, property names, enclosing functions/test scenarios, and current ownership semantics to
relocate each candidate. Drop candidates already resolved or no longer justified. Discover any new
occurrences introduced by adjudication; do not restore old code to match this note.

Do not edit inputs while an active review relies on them. Coordinate the later pass with the main
implementation thread. Earlier review receipts do not automatically cover subsequent source changes;
validate the final delta without restarting unrelated review scopes merely for ceremony. Keep this
implementer handoff outside the round `02` blind-review evidence lane.

## Exact rule and scope

Apply the human's object-operation convention, cumulatively with canon:

- A genuinely clear single-line function value stays a compact arrow property.
- A multiline object-literal operation uses method shorthand when semantics permit.
- Preserve `async`, type parameters, parameters/defaults/rest, return annotations, and the body.
- For a multiline expression arrow, introduce an explicit `return` without changing promise
  adoption, laziness, exception timing, object construction, or evaluation count.
- Change only this syntactic form. No unrelated assertion factoring, naming cleanup, helper
  extraction, file movement, import sorting, formatting sweep, or public type/API redesign.
- Do not change callbacks passed as arguments, array entries, standalone bindings, class fields, or
  assignments to existing properties. Object-literal hooks are candidates even when their consumers
  later invoke them as callbacks; being a callback is not by itself an arrow requirement.
- Check lexical `this`, `arguments`, `super`, and `new.target`, including parameter initializers and
  nested arrows that inherit them. Check any function reflection/receiver-sensitive contract too.
- Capturing ordinary outer locals is not, by itself, a reason to retain an arrow: methods also close
  over those locals.

A block arrow that discards a call's result must not become a value-returning expression by
accident. For example, `events.push(e)` returns a number, unlike a block containing only that
statement. Prefer method shorthand rather than introducing clever compression. A clean compact arrow
is an exception worth retaining, not a line-width target to force.

## Candidate inventory

### Production code

1. `code/sys.tools/src/cli.crypto/cmd.hash/cmd.hash.ts`
   - Around 83: `onHashProgress` in the `runHashJob` options.
   - Body forwards to `updateSpinnerProgress`. Assess whether a compact arrow is genuinely clearer;
     the observed local function returns void. Otherwise use `onHashProgress(e) { ... }`.

2. `code/sys/server/src/m.server.dist/u.server.start/u.serve.ts`
   - Around 246, 249: `onQuit`, `onKey` in `effects.bindKeyboard` inside the serving lifecycle.
   - Preserve both `async` modifiers, all return paths, and settlement/close sequencing. Surrounding
     `.then` callbacks and local arrow bindings are not targets.

3. `code/sys/server/src/m.server.dist/u.server.screen/u.layout.ts`
   - Around 373, 384, 396: `render` options in `clipLine`, `clipValue`, `clipServiceUrl`.
   - Named render operations are natural shorthand candidates. Preserve interpolation/ANSI bytes and
     the local `tailStart` calculation; no rendered-output redesign.

4. `code/sys/server/src/m.server.dist/u.server.start.verified/u.request.handler.ts`
   - Around 201, 216: `read` operations passed to `deps.serveBytes` for manifest and asset reads.
   - These are expanded expression arrows. A method must return the same `readManifest`/`readAsset`
     promise; do not add `async`, eagerly execute the read, or alter cancellation arguments.
   - Keep the compact missing-file `read` arrow around 192.

### R2 sample and driver tests

5. `code/sys.driver/driver-cloudflare/-sample/deploy/src/-test/-app.test.ts`
   - Around 11, 65: `shell` doubles in `createApp` options.
   - Preserve call counting, URL capture, and explicit `Promise.resolve` responses.

6. `code/sys.driver/driver-cloudflare/-sample/deploy/-scripts/-test/-u.proof.test.ts`
   - Around 130, 171: throwing `get` properties in replacement/late environment-reader objects.
   - Do not touch nearby `reader.get = ...`, `options.start = ...`, or `mutable.log = ...`
     assignments.
   - Nearby receiver-sensitive original-reader instrumentation explicitly checks `this`; preserve
     it. That is not evidence that the separate throwing object-literal `get` arrows require lexical
     this.

7. `code/sys.driver/driver-cloudflare/src/m.r2/-test/-m.ReadRoute.fromDist.test.ts`
   - Around 210, 224: `response` factories in acquisition-failure cases.
   - Preserve lazy Response creation and the throwing case. Already compact response factories stay.

### Pi and Vite tests

8. `code/sys.driver/driver-pi/src/m.cli/m.profiles/-test/-u.start.gui.test.ts`
   - Around 164: `openGeneration` in the mismatched-generation harness options.
   - Only the outer object operation is a candidate. Its release callback remains an argument arrow.
   - Exclude the separate `createHarness` fallback around 1020; see exclusions below.

9. `code/sys.driver/driver-pi/-scripts/m.start.gui.preview.build/-test/-.test.ts`
   - Around 564: expanded `build` expression in the pre-host build/cleanup failure case.
   - Preserve the returned Promise and failed-build fixture. Neighboring `allocate` is already a
     method.

10. `code/sys.driver/driver-vite/src/m.vite/-test.external/-dist.pipeline.ts`
    - Around 70: `select` returning private/public projections in `Pkg.Dist.project` options.
    - A shorthand method should explicitly return the same object. The inner `.filter` callback
      stays an arrow. Do not change projection membership or introduce another build matrix.

### FS tests and fixtures

11. `code/sys/fs/src/m.Pkg.Dist/-test/-u.pinned.fixture.ts`
    - Around 99, 103, 107, 111: `traceIo` overrides `lstat`, `open`, `readDir`, `realPath`.
    - Preserve trace order, the three async operations, and the synchronous iterable-returning
      readDir.

12. `code/sys/fs/src/m.Pkg.Dist/-test/-pinned.verify.io.test.ts`
    - Repeated multiline `open`, `lstat`, `read`, `close`, and `readDir` doubles.
    - Observed anchors: 46/53, 86, 105, 294, 312, 335, 362, 434, 462/469, 493/499, 520,
      531/537, 551.
    - Scenarios include cancellation, filesystem replacement, short reads, and close failures.
    - Preserve async/rest/signature behavior, mutation timing, and returned handle shapes. Keep
      compact forwarding `close`, `stat`, and `read` arrows. Async-generator callbacks are not
      targets.

13. `code/sys/fs/src/m.Pkg.Dist/-test/-local.verify.test.ts`
    - Around 112: `lstat` in selected-root replacement after canonicalization.
    - Keep the observation counter, early return, and synthetic inode change in the same call.

14. `code/sys/fs/src/m.Pkg.Dist/-test/-pinned.verify.tree.test.ts`
    - Around 103: `lstat` in the stable-special-entry test.
    - Preserve async behavior and the conditional FileInfo result.

15. `code/sys/fs/src/m.Pkg.Dist/-test/-input.admission.test.ts`
    - Around 393: `forbiddenIo().io.readDir` records a call and throws synchronously.
    - Do not add async or turn this into a rejected Promise. Keep compact lstat/open/realPath
      arrows.

16. `code/sys/fs/src/m.Pkg.Dist/-test/-project.test.ts`
    - Around 242: expanded `realPath` expression in the source-alias cases.
    - Preserve branch selection and the returned Promise. Neighboring compact I/O forwards stay.

17. `code/sys/fs/src/m.Pkg.Dist/-test/-Pkg.Dist.test.ts`
    - Around 142: `onHashProgress` in ordered-progress coverage.
    - Preserve implicit undefined return; do not replace the body with a value-returning
      `events.push`.

### Server tests

18. `code/sys/server/src/m.server.dist/-test/-materialize.test.ts`
    - Around 179, 395, 814, 859: `Stage.promote` doubles.
    - Around 322, 434, 477: `Tree.seal` doubles.
    - Around 903: capability `create` override in committed-truth/cleanup-pending coverage.
    - Preserve `async`, the multiline typed signature, rest `Parameters<...>` annotations, freezes,
      fault timing, and release/settlement behavior. The outer `rootedWith` callbacks and local
      `discard`/`promote` bindings remain arrows; do not broaden into ownership refactoring.

19. `code/sys/server/src/m.server.dist/-test/-server.serve.test.ts`
    - Largest repeated cluster: dependency and effect operation properties throughout the file.
    - `verify`/`verifyLocal`/`startHttp`: around 82–86, 123–131, 174–182, 257–261, 298–306, 476–484,
      574, 616, 722–726, 881, 1137–1153, 1530, 1603, 1659, 1788, 1863.
    - `bindKeyboard`/`createScreen`/`dispose`/`open`/`isInteractive`: around 269, 496, 733–760, 888,
      928–938, 1021–1028, 1074–1084, 1166–1174, 1328–1335, 1466–1473, 1515–1518, 1609–1617,
      1665–1672, 1715–1725, 1794–1797.
    - Descriptor `value` functions replacing `close`: around 651, 920, 1153.
    - Search locators cover more occurrences than were individually inspected. Representative blocks
      around 82–182, 722–760, 920–938, and 1137–1174 were opened during this scan. Revalidate every
      proposed conversion, especially descriptors and multiline expression factories.
    - Keep no-op/one-line forwards, embedded Promise executor callbacks, and `.then` callbacks.
      Descriptor `value(cause) { ... }` is a method of the descriptor object, not an accessor
      rewrite.

20. `code/sys/server/src/m.server.dist/-test/-server.browser-policy.test.ts`
    - Around 148–168: verification/listener/presentation counters.
    - Around 291: delayed async `verify`; around 426: quoted `'files:read'` operation.
    - Around 595: expanded `verifyLocal`; around 643: async `serveBytes` response manipulation.
    - Preserve quoted property names, rest parameters, interception order, and exact response
      behavior.

21. `code/sys/server/src/m.server.dist/-test/-server.start.authority.test.ts`
    - Around 364, 403: expanded `verify` result factories in startup-failure/recovery proofs.
    - Around 496: quoted `'files:read'` returning a deliberately malformed content reference.
    - Preserve malformed fixture shape; compact to an arrow only if genuinely readable, otherwise
      use a method returning the original object/Promise.

22. `code/sys/server/src/m.server.dist/-test/-server.serve.screen.test.ts`
    - Around 253: `onSize`; around 368, 478, 494: `repaint` operations.
    - Preserve scheduled flush timing and synchronous throws. No conversion to async operations.

### Tools provider tests

23. `code/sys.tools/src/cli.deploy/u.providers/provider.r2/-test/-u.push.test.ts`
    - Around 591: the human's `createFiles` example in paged remote-listing coverage. It now has a
      block containing `listPages` and returns `filesHandle({ writes, removes, listPages })`.
    - Additional expanded `createFiles` factories: around 153, 326, 375, 432, 466, 494, 537, 663,
      687, 713, 788, 812, 844, 946.
    - Around 329: async `writeDelay`; around 381: expanded `writeError` expression.
    - Representative blocks around 326–381 and 591 were opened; remaining factory occurrences are
      discovery leads to reopen. Preserve handle construction per invocation, delay/throw behavior,
      contextual types, page ordering, and captured observation arrays.
    - Keep compact local `const createFiles = ...` bindings and inner callbacks unchanged.

## Deliberate exclusions and cautions

No candidate was changed in this scan, so these are future exclusions, not applied transformations.

- `createHarness` in Pi's `-u.start.gui.test.ts`, around 1020:
  `openGeneration: options.openGeneration ?? ((args) => { ... })` is conditional function selection,
  not a direct arrow-valued operation. A wrapper method could change selected function identity,
  receiver behavior, or when the option is observed. Leave it in this strictly syntactic pass.
- The nearby `runtimeRoot: () => ROOT`, compact `startGui`/`dispose` Promise forwards, and FS handle
  forwards already satisfy the compact-arrow convention.
- `rootedWith((rooted) => ...)`, `openedGenerationFixture(..., () => ...)`, `.map`/`.filter`/`.then`
  callbacks, Promise executors, and async-generator callbacks are argument functions, not
  properties.
- Local declarations such as Vite's `const response = (args: RArgs): R => { ... }`, the staging
  spinner's `const render = (): string => { ... }`, and typed local fault functions are false
  positives for broad textual searches. Do not change them under this rule.
- Assignments such as `reader.get = () => { ... }` cannot become method declarations at that site.
- Existing methods that deliberately inspect `this` must remain untouched. No lexical-arrow
  requirement was established in the inspected direct-property candidates, but this is not a
  semantic clearance for every search hit or later revision.
- Do not remove a body or use a comma expression merely to make an operation fit one line.

## Representative future transformation

Only the property header changes for the human's existing block-bodied example:

```ts
// Before:
createFiles: () => {
  const listPages = makePages();
  return filesHandle({ writes, removes, listPages });
},

// After:
createFiles() {
  const listPages = makePages();
  return filesHandle({ writes, removes, listPages });
},
```

`makePages()` above is illustrative, not a proposed new helper. In the real candidate retain the
existing listPages initializer byte-for-byte. Do not extract it as incidental cleanup.

For an async operation, keep its original body and returns:

```ts
// Before:
open: async (path) => {
  calls.push({ operation: 'open', path });
  return await DEFAULT_IO.open(path);
},

// After:
async open(path) {
  calls.push({ operation: 'open', path });
  return await DEFAULT_IO.open(path);
},
```

## Applying and proving the eventual pass

1. Re-establish the then-current open scope and coordinate a write window with the implementation
   owner. Preserve unrelated work and do not patch by recorded line numbers.
2. Reopen governing canon and owning task/config files. Revalidate lexical semantics and contextual
   TypeScript inference before changing each operation. This pass does not authorize public function
   type changes or changed method-variance contracts.
3. Prefer header-only edits for block bodies. For expression bodies, add only method syntax and the
   explicit return needed to preserve behavior. Keep synchronous throws versus Promise rejection,
   discarded return values, construction timing, and nested callbacks unchanged.
4. Inspect each exact delta. Preserve surrounding bytes where practical; reject opportunistic
   cleanup.
5. Run exact-file formatter checks under the owning configuration, relevant type-checking, and
   narrow owner tests. Inspect task argument forwarding and effects before choosing commands. A
   runtime or dependency denial is a stop, not permission to expand authority.
6. Serialize any required build/browser/shared-fixture lanes. Do not execute the full cross-module
   pipeline just to obtain a cosmetic refactor receipt when a narrower proof covers the changed
   seam.
7. Report exact changed files, representative before/after forms, arrows deliberately retained and
   why, commands actually run, and unexecuted proof. Preserve enough delta evidence for the main
   thread to inspect assertion/ownership preservation before landing.

The scan ran no source formatter, type-check, or tests: no implementation was changed. Those checks
belong to the eventual applied pass. Any Markdown-only check of this handoff is not code proof.

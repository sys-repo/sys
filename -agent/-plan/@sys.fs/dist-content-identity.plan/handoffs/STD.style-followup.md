# Std test layout and canon style — post-adjudication follow-up

**Source follow-up executed and verified; canon clarification prepared only.** The human returned
**ready; not yet S-tier**, with one inherited P3 on redundant casts and an `any` test callback. That
finding was accepted and corrected together with the prepared layout refactor; the
[Std receipt](../landing/STD.native-containment.landing.md#returned-independent-review--accepted-p3-and-verified-finish)
records fresh proof. No additional blind pass or Git mutation occurred. This note remains
implementing-thread material, not input to a blind reviewer or a new review gate.

Preparation and final HEAD: `8ba45c06f9b31ded1800f79b1318ba1e407819d1`. The initial candidate was 41
insertions/3 deletions; after finish the same two-file cut is 49 insertions/11 deletions. The index
remains empty. The reference is not a frozen snapshot or an isolated-commit attestation.

## 1. Completed source refactor after adjudication

Owner: `code/sys/std/src/m.Path/-test/-.test.ts`, inside the existing two-file Std cut. `within.ts`
was not changed for this finish. No behavioral finding required a predicate correction.

The repeated platform condition is now named once. Each atomic ignore option stays beside its test
name, and existing join/separator selections reuse that condition:

```ts
const isWindows = Deno.build.os === 'windows';
const platformJoin = isWindows ? Path.Join.windows : Path.Join.posix;
const platformSeparator = isWindows ? '\\' : '/';

it('Is.within: POSIX backslashes are filename characters', { ignore: isWindows }, () => {
  const root = '/site/root';
  const cases: readonly [string, boolean][] = [
    ['/site/root/..\\report.txt', true],
    ['/site/root/name\\part.txt', true],
    ['/site/root/\\..\\report.txt', true],
    ['/site/root/..literal.txt', true],
    ['/site/root/nested/../..\\report.txt', true],
    ['/site/root/../outside.txt', false],
    ['/site/root/..\\folder/../../outside.txt', false],
    ['/site/root-secret/report.txt', false],
  ];
  for (const [candidate, expected] of cases) {
    expect(Is.within(root, candidate), candidate).to.eql(expected);
  }
});

it('Is.within: Windows separators and drive boundaries', { ignore: !isWindows }, () => {
  const root = 'C:\\site\\root';
  const cases: readonly [string, boolean][] = [
    ['C:\\site\\root', true],
    ['C:\\site\\root\\folder\\report.txt', true],
    ['C:/site/root/folder/report.txt', true],
    ['C:\\site\\root\\..literal.txt', true],
    ['C:\\site\\root\\..\\outside.txt', false],
    ['C:/site/root/../outside.txt', false],
    ['C:\\site\\root-secret\\report.txt', false],
    ['D:\\site\\root\\report.txt', false],
  ];
  for (const [candidate, expected] of cases) {
    expect(Is.within(root, candidate), candidate).to.eql(expected);
  }
});
```

The actual calls remain nested in `describe('Path.Is')`; this example shows their applied shape.
Keep case tables vertical and each tuple compact: the table enables comparison, while each tuple is
one assertion's data. Preserve titles, inputs, expectations, candidate-labelled failures and OS skip
conditions. Keep the two short assertion loops; a shared helper would add indirection without owning
a distinct behavior. Do not shorten meaningful test names just to fit a line.

The P3 finish removed four redundant `as unknown` casts from containment assertions. The extension
probe uses an `unknown[]` and a loop, with a documented `as string` only at its deliberately invalid
call. Public types and all refusal assertions were preserved.

Current owner configuration was inspected. Surgical edits and checks of the actual indented layout
completed successfully. From `code/sys/std`:

```sh
deno task test --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/m.Path/ ./src/-test/-namespace.freeze.test.ts
deno task test --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot
deno task check --frozen --cached-only
deno fmt --check ./src/m.Path/u/within.ts ./src/m.Path/-test/-.test.ts
deno lint ./src/m.Path/u/within.ts ./src/m.Path/-test/-.test.ts
```

Whole selected files, the source diff and scoped whitespace were inspected. Fresh results: **4
suites / 63 steps** focused and **208 suites / 2,814 steps** full Std, zero failures, one Windows
step ignored on Darwin. Typecheck, exact-file format/lint and scoped whitespace passed. Prior review
is not a new-byte independent verdict. Grants, dependencies, assertions and platform behavior were
not changed.

## 2. Canon-level style pass after adjudication

Primary owner: `../sys.canon/-canon/protocol.formatting.md`. Apply the canonical repository's own
instructions before any later edit. Supporting context: `protocol.lang.md`, `protocol.testing.md`
and `-sys.md` in that same directory. Keep this separately attributed from the Std source cut.

The existing rule already says to use horizontal space for cohesion, vertical space for hierarchy,
and compact formatter-stable leaf option bags. This instance is an application gap, not evidence
that a competing style policy or general helper abstraction is needed.

The bounded follow-up should:

- Assess whether one function-call/callback example makes the existing rule operational enough.
- Show a compact `it(name, { ignore: condition }, () => { ... })` header above a vertical callback
  body, with a semantically named repeated condition when it genuinely improves the call site.
- Contrast a short atomic option bag with a multiline bag that contains real hierarchy, comments or
  formatter-required overflow. Compactness is not the goal when it obscures meaning.
- Explain that formatter acceptance does not excuse low-signal multiline input; inspect the authored
  call shape before checking it. Do not extract one-use names or helpers merely to game line width.
- Preserve meaningful case-table rows, descriptive titles and explicit failure attribution.
- Keep any clarification in the existing formatting owner. Change language/testing cross-references
  only if needed; do not duplicate the rule across canon files or initiate a repository-wide sweep.
- Use exact-file previews and surgical edits. No formatter-ignore directives, broad formatter writes
  or policy weakening. Provide a separate exact-path canon handoff and identify verification limits.

The source refactor, P3 adjudication and fresh source checks above are complete. The canon-level
pass remains prepared, not executed; no canonical policy edit is included in this source finish.

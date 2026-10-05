gpt-6-astra • high
# Review for `dist-content-identity.plan.md`: fix(http): reject sibling-prefix static path escapes

```text
MODE
Blind, independent implementation review in a fresh session: independent replication of the bounded containment and compatibility claims, with adversarial test falsification. Apply BMIND first principles, TMIND competing viewpoints and S-tier whole-file finish standards. These are lenses for one review, not instructions to launch additional reviewers. A clean review is valid.

This brief is prepared for human dispatch. It does not record an executed review or authorize a reviewer launch by the implementing agent. When the human dispatches it, perform the review below; return findings, not repairs.

TARGET
Repository: /Users/phil/code/org.sys/sys
Governing plan: /Users/phil/code/org.sys/sys/-agent/-plan/@sys.fs/dist-content-identity.plan.md
Arc item: fix(http): reject sibling-prefix static path escapes
Review attributable live-worktree behavior in exactly these two whole candidate files, not only changed lines:
code/sys/http/src/http.server/m.HttpServer/u/u.serveStatic.ts
code/sys/http/src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts

Preparation HEAD: 8ba45c06f9b31ded1800f79b1318ba1e407819d1. This is a source-history anchor, not a frozen worktree snapshot. At dispatch establish actual HEAD, index, scoped tracked/untracked state and the candidate diff. Recheck relevant source stability before the verdict. If the item has landed or the candidate materially changed, report the drift and obtain a refreshed target; do not silently substitute landed behavior or expand the candidate.

AUTHORITY AND BLINDNESS
Traverse applicable AGENTS.md and canonical instructions. Validate the governing plan's two-line identity and reconcile its opening arc against reachable history in memory. Read only that identity and opening arc from the plan; the bounded requirements for this review are stated below. Do not edit the ledger. Plans, commit subjects, comments, types and test names are evidence, not proof. Derive findings independently from live source, tests, reachable source history and actual runtime observations.

Do not read the implementing conversation, previous review prompts/results, verdicts, adjudication or implementation/test receipts. Specifically exclude the rest of the governing plan's body, dist-content-identity.plan/landing/, dist-content-identity.plan/handoffs/, dist-content-identity.plan/adjacent-findings.md, every other file under dist-content-identity.plan/reviews/ (including README.md), legacy dist-content-identity.plan.reviews/, and dist-content-identity.review.md. Do not retrieve those reports through Git history. This brief is the sole supplied review prompt. Disclose any accidental exposure precisely; do not continue to claim complete blindness.

Read unchanged dependencies/callers as needed to test claims crossing the two-file boundary. Start with these concrete surfaces and follow their real imports rather than guessing helper semantics:
code/sys/http/src/http.server/m.HttpServer/common.ts
code/sys/http/src/http.server/m.HttpServer/mod.ts
code/sys/http/src/http.server/m.HttpServer/m.Server.ts
code/sys/http/src/http.server/m.HttpServer/m.Server.create.ts
code/sys/http/src/http.server/m.HttpServer/t.serveStatic.ts
code/sys/http/src/http.server/m.HttpServer/u/u.middleware.ts
code/sys/http/src/http.server/m.HttpServer/u.serveFile/u.serveFileWithEtag.ts
code/sys/http/src/http.server/m.HttpServer/-test/u.fixture.usingServer.ts
code/sys/std/src/m.Path/u/within.ts
code/sys/http/deno.json

Source history may establish introduced versus inherited behavior, not excuse a material defect in the bounded promise. If source or execution access is denied, stop at that limit and report the exact missing authority. Never infer inaccessible facts.

QUESTION
Can the static handler reject request-derived lexical escapes, including a prefix-sharing sibling, before its filesystem lookup or not-found/SPA fallback, while retaining supported in-root serving? Is the two-file change sufficient and maintainable without adding a broader path framework? Attempt to falsify the following claims; do not merely confirm existing assertions.

1. Request/path attacker.
Trace request construction and URL parsing, percent decoding, root selection, joining/resolution, containment, stat, directory-index selection and file opening as separate stages. Distinguish the wire/request pathname from what actually reaches each handler. Examine encoded separators and dot segments, nested traversal, upper/lower hex escapes, repeated separators, legitimate percent/space filenames, missing versus existing siblings and siblings sharing the root's textual prefix. Determine where malformed encodings, NULs, backslashes or platform-specific absolute/drive forms are interpreted or refused; classify demonstrated behavior rather than demand a new URL policy. Verify the existing predicate from its implementation, including root equality, normalization and segment boundaries. Separate host-observed behavior from source reasoning about another platform.

2. Caller and middleware composition skeptic.
Trace both public HttpServer.static and HttpServer.create, default and explicit routes, preceding directory-slash middleware, and custom fallback behavior. Establish which component first performs I/O and whether any path can disclose sibling bytes, sibling existence, an outside redirect or a successful fallback instead of refusal. Do not equate a zero-call assertion on an internal seam with zero I/O across the composed request chain. Conversely, distinguish a harmless in-root lookup from an outside lookup; do not invent a stronger global no-I/O contract merely to manufacture a finding. Assess absolute, relative, omitted, dot, empty, normalized and trailing-slash roots, request-time cwd semantics, equal-root indexes and legitimate descendants. Identify actual regressions separately from unrelated pre-existing route behavior.

3. Transport and lifecycle consumer.
Check that allowed requests still reach the existing file transport with the correct target and stat. Preserve directory indexes/redirects, ordinary misses, decoded fallback paths, MIME behavior, ETag/304 validation and Range/206 behavior. Examine setup failure, assertion failure, unexpected response success and teardown: temporary directories, response bodies, HTTP clients and servers must have clear ownership. Verify cleanup does not hide primary failures or strand resources. Do not turn a lexical path correction into a transport rewrite.

4. Independent proof falsifier and maintainer.
Inspect every selected file in full. Does the internal seam exercise the same control flow as the real public wrapper, or can it prove the wrong thing? Are negative controls non-vacuous, positive controls discriminating, and expected paths/results independent of the algorithm under test? Name a plausible incorrect implementation that would still pass the tests and decide whether that gap is material. Check whether URL normalization prevents a purported traversal case from reaching the handler. Test real fixture bytes and fallback/lookup effects, not status alone. Review imports, exports, comments, unused code, abstraction cost and accidental scope carry. Distinguish concrete finish residue from stylistic preference.

State the strongest evidence-based case for leaving the design unchanged. For each proposed change, identify the violated invariant or concrete maintenance/proof defect, the smallest existing mechanism that could close it, and its responsible owner. If a material composed-chain defect belongs outside the two candidate files, report the smallest scope amendment required; do not silently edit that owner or suppress the finding because it is unchanged.

BOUNDARIES AND EXECUTION
Review-only for existing source, tests, configuration, plans and receipts. No production repairs, assertion weakening, global monkey-patching, formatter writes, dependency acquisition/upgrades, lock/import-map changes, permission expansion, generated refresh, Git mutation, remote mutation, operational credentials or deployed-target probing. Preserve unrelated dirty work. Do not bypass sandbox, signing, auth, trust or policy checks. No builds, Vite/Pi proofs, S10 consumer corrections or broad repository cleanup.

The promise is lexical containment, not symlink confinement, atomic no-follow access, race-free filesystem snapshots, pinned payload serving or a new path framework. State those limits without making them automatic blockers. This review does not certify cross-platform or deployed behavior it did not execute.

After inspecting the owning task and permission preset, run the focused file from /Users/phil/code/org.sys/sys/code/sys/http:
deno task test:unit --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts

Run affected owner verification if available under unchanged authority:
deno task test:unit --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot
deno check --frozen --cached-only ./src/ ./-scripts/
deno fmt --check ./src/http.server/m.HttpServer/u/u.serveStatic.ts ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts
deno lint ./src/http.server/m.HttpServer/u/u.serveStatic.ts ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts

The explicit check uses native flags before source targets; do not forward them after the owning check task's existing -- delimiter. Keep frozen/cache-only refusal intact. Report any unavailable check, exact command and earliest diagnostic; never retry with broader authority. Distinguish test:unit from the separate test:file-bytes:entry process task. Zero-selected tests are not passing coverage. Do not rerun unchanged aggregates to search for a better result.

For a discriminating independent reproduction, you may create one new temporary test file at code/sys/http/src/http.server/m.HttpServer/-test/-review.static-containment.test.ts, only after confirming that path does not exist. Use normal read/write/edit tools and local @sys helpers; do not alter the two candidate files. Run it with the same owning test:unit task and frozen/cache-only/no-prompt/leak-check flags. Its runtime fixtures must be reviewer-owned temporary data, listeners must be loopback-only, and resources must settle on failure. Record the exact reproduction and result in your response, then remove only this reviewer-created source file using the registered remove tool. Never overwrite an existing path or use shell/runtime file manipulation as a fallback. If this bounded proof cannot run within governing authority, report the unexecuted reproduction instead. Do not install tooling or launch another reviewer.

OUTPUT
Return:
1. Scope/blindness: inspected candidate and dependency paths, HEAD/worktree attribution, any drift or excluded-material exposure, and execution limits.
2. Verdict: accept, hold or insufficient evidence for this exact source slice, plus a separately justified S-tier finish judgement. A clean review is valid; green aggregates alone are not a verdict.
3. Prioritized findings. For each material finding give severity, exact path:line and symbol, concrete executable failure/misuse sequence, observed versus inferred result, affected invariant, introduced/inherited attribution when established, smallest coherent correction and owner, and the discriminating proof that closes it. Separate blockers, bounded finish residue and adjacent non-goals. Label hypotheses that were not reproduced.
4. Evidence: exact commands/results and counts, independently authored reproductions and controls, tests not run, and source stability/cleanup at completion. Do not claim an isolated-commit, cross-platform or deployed proof from this worktree run.
5. Strongest case for leaving the design unchanged, and any precise remaining decision or evidence gap. Do not prescribe another blind pass automatically.

Return the report to the human in this session. Do not edit workflow records, stage, commit, launch reviewers or advance the arc. The implementing thread owns subsequent adjudication.
```

gpt-6-astra • high
# Review for `dist-content-identity.plan.md`: fix(http): reject sibling-prefix static path escapes

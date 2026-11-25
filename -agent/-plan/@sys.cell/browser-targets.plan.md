@sys.cell
browser-targets.plan.md
- [x] 192d82165 feat(cell): resolve declared browser targets from the ready service snapshot
- [x] 1f0775726 feat(cell): declare browser targets in the Stripe sample
- [x] f91e3bba6 fix(cli): retain keyboard release failure across shutdown retries
- [x] 894e414e2 feat(cell): open browser targets and quit from the ready screen
- [x] 113f67181 feat(cell): declare browser targets for the remaining sample previews and the UI cell
- [x] cfa942bf5 feat(cell): mark resolved browser targets in the ready service list
- [x] 02c9a2bd9 docs(cell): explain browser targets in service and start help
- [x] 933204dab feat(cell): adapt the ready-screen shortcut footer to available rows

## Operator contract

`browser` names the destination, not the trigger. Author-facing definition: **Published pathname(s) to open when you press `o` on the Cell ready screen. Nothing opens on startup.** Put this sentence with the descriptor field and service DSL, not just in CLI help. The footer teaches the gesture: `open: o (browser)` and `quit: q`. Do not name a physical key in YAML or add a shortcut map.

In `code/sys.ui/ui/-config/@sys.cell/cell.yaml` the entire change is one property on the existing `sys.ui:proxy` service:

```yaml
  - name: sys.ui:proxy
    browser: '/'
```

Leave `proxy.yaml` and the other three services unchanged. Either mode opens the published proxy root, not the upstream view, POST route, or a guessed `/?dev` walkthrough. Cell must not know that the owner is a proxy. In the Cell samples use `'/'` on `cell.vite`'s logical `view` across Serve/Vite variants; demonstrate `['/', '/payments/']` on the Stripe sample's `cell:proxy`.

## 1. Declare and resolve

- Optional on `Cell.Services.Service` only; not a variant binding, endpoint argument, task, or startup option. Omitted means no target. Accept one literal URL pathname or a nonempty ordered list of them. Both forms have the same semantics. No boolean, absolute URL, query, fragment, label selector, route-pattern expansion, or implicit first URL.
- Validate selector shape at descriptor load: require a leading slash; reject raw `?`, `#`, backslash and control characters. Compare literal pathname text, not a decoded or base-resolved URL. `/payments` and `/payments/` differ; `%2F` stays encoded; `//reports` is a pathname, never a host reference. Use `t.StringUrlRoute` as descriptive vocabulary, not a substitute for validation.
- `selection.descriptor` retains the declaration across binding selection. At ready, capture each owner's status once. Derive both the service display and a separate ordered target/diagnostic result from that capture; carry the result alongside `StartCellReady.render`. Never resolve from a clipped display URL, rewritten `localhost`, label, owner config, or second status read.
- Admit only absolute parseable HTTP(S) hrefs. Reject raw C0/C1 controls and DEL before parsing, and reject credentials; do not echo rejected input. Keep this consistent with service-link admission (`m.Fmt/u.service/u.url.ts`), without importing renderer internals or changing WS(S) display eligibility.
- Compare each selector verbatim with `URL.pathname`. Count distinct **serialized `URL.href`** matches, including search and hash. Zero matches yields a missing diagnostic; more than one yields an ambiguous diagnostic with count; exactly one contributes the actual href. Collect by descriptor order, then selector order, globally deduplicating hrefs by first selection. Multiple intentional targets are not ambiguous. Never fall back to a different URL or probe via GET.
- Proof: reject invalid shapes and variant placement. Permute published hrefs; the result must not change. `http://x` and `http://x/` are one target; two origins or two queries for `/` are ambiguous. Cover duplicate selections across services, missing owner status, a partially matched array, excluded schemes/credentials/controls, switched variants, and changed owner status after capture. Resize must neither reread status nor alter requests.

## Keyboard ownership (`@sys/cli`)

Review and check this slice independently before landing it. `Bind.Handle.releaseFailure` distinguishes input release failure from a listener failure, including after a successful shutdown retry. The input-ownership test pins the original error identity. `@sys/cli/testing` exposes the real binding with caller-supplied input so Cell can exercise that contract without owning a terminal. Keep the slice to `m.core/m.Keyboard/{t.ts,u.bind.ts,-test/-u.input.test.ts}` and `m.testing/{mod.ts,u.bindKeyboardInput.ts}` under `code/sys/cli/src/`; Cell's reporter, policy, and regression fixtures belong to the next commit.

## 2. Act and report

- Ready interactive binding only: unmodified lowercase `o` requests each resolved href once per press, in order. No keyboard or opener in raw mode; no opener during start, repaint, or completion. A successful detached handoff is not evidence that navigation succeeded or that a new tab exists.
- Catch launch failures per target; continue, leave services and keyboard running. Keep selection diagnostics in ready-screen state from the first ready frame, even if no open hint can appear. Distinguish `no matching HTTP(S) URL`, `N matching HTTP(S) URLs`, and `open request failed`; identify service and selector, not raw href or launcher error text. Keep last-press handoff failures across redraw until the next press. Bound output to the viewport; diagnostics outrank optional hints and reappear on growth.
- Reuse `Open.invokeDetached` only through a path established to deliver the href as literal data. The Linux fallback chain in `code/sys/process/src/m.open/u.invokeDetached.ts` includes interpreter-based launchers. Mocked candidate order is not proof of literal delivery. Before enabling handoff on such a path, establish owner-level fidelity with a harmless argument-capture fixture, or use a proven literal-argument path and report unavailable otherwise. No Cell-side escaping or weakening permission policy.
- Keep `quitKeys: 'interrupt-only'`. Handle unmodified lowercase `q` separately via a normal quit request in Cell's first-winner shutdown owner. Successful cleanup exits normally; failures remain failures. Do not call `interrupt()` or exit directly for `q`; leave Ctrl+C, exit 130, escalation, and redraw semantics intact.
- Use `Cli.Fmt.Keyboard.command/row` and `Cli.Screen.Dock.bottom`, as Vite does. This step used spare rows only; §6 refines which service rows take priority over hints. Show a complete fitting footer only for live keys: full or compact open/quit with targets, quit only without targets, none without a live binding. Dock the dim dashed rule immediately above the commands. If both rows do not fit, omit both; hiding the footer never unbinds keys. On EOF or keyboard failure remove the footer without losing service facts or replacing the winning shutdown cause. Share only proven common footer composition, not the two keyboard loops.
- Proof: injected opener throws on target two of three; all three attempts occur in order, the next press works, and warning survives repaint. Selection warnings appear without a press when all targets miss. Shrink/grow, unavailable binding, clean EOF, and byte-identical raw output. PTY: `q` releases terminal, session and ports on normal exit; Ctrl+C still exits 130. No tests should launch a user's browser.

## 3. Declare the remaining preview destinations

Declare a destination only for a human-facing page published by the selected service:

- `cell.vite`, service `view`: `/` across Serve and Vite bindings.
- `cell.deploy`, service `deploy:view`: `/view/.pulled/ui.components/`, the preview path Serve publishes. Not `/`, and not a property of the staging task.
- `sys.ui`, service `sys.ui:proxy`: `/`. Leave Stripe's two existing destinations unchanged.
- Cloudflare deploy sample, service `r2`: `/ui/` is the published, documented UI for a Cell launch. Its standalone `serve` task calls the owner directly; do not change that task or its permissions to supply a Cell shortcut.

Leave empty templates, API-only services, and fixtures without a declaration.

Proof: load each adopted descriptor and resolve its selectors against representative published URLs, including both Vite sample modes; assert the ordered hrefs without launching a browser. In `sys.ui` dev mode, verify one request for the actual proxy root even with the footer hidden, then graceful `q` cleanup. No owner-config or routing changes.

## 4. Mark selected URL rows

On the interactive ready screen, put a cyan `•` two terminal cells before the first displayed URL cell (`• `). Use the existing label/value gap: marked and unmarked URLs start in the same column. If the gap is too narrow, or clipping leaves only an omission, omit the bullet rather than shifting the URL, hiding a fact, or marking an ellipsis. Keep the bullet outside the URL hyperlink. Raw output and other formatter callers remain byte-identical.

A bullet means **this service selected this published href**, not “first URL”, “browser available”, or “navigation succeeded”. Carry service-local successful matches from the same ready snapshot, before cross-service handoff deduplication. Never infer membership from rendered text, loopback rewriting, color, or pathname alone. Two services selecting the same href get two marked rows and one open request; a service merely publishing that href gets no mark. Missing and ambiguous selectors mark nothing. If a shared formatter seam is needed, it takes row decoration, not Cell's `browser` policy.

Proof: in Stripe's proxy rows mark `/` and `/payments/`, not `/view/` or `/-/stripe/`, nor either upstream. Check the cyan bullet's column, the unchanged hyperlink target, narrow/wide redraw, service-local selection under deduplication, and byte-identical raw output. No browser or network request is needed for formatter proof.

## 5. Document the operator contract

Keep the field and service-local matching rule in service DSL (`m.help/yaml/dsl.service.yaml`); keep the gesture, bullet meaning, raw-mode boundary, and handoff caveat in start help (`m.help/yaml/start.yaml`). The examples belong to the adoption slice, not this docs commit.

## 6. Adapt the ready-screen shortcut footer

Keep the shortcuts discoverable without losing the last useful service context. Cell displays a service snapshot, not a log: protect the rows its service formatter selects at a small height, not the last lines of the rendered string. Keep its title, main URL, secondary URL, then detail priorities and display order. One detail can span several physical rows; authored blank lines count, decorative dividers do not.

At a fixed width, allocate the rows below the header in this order: protected service rows, ready warnings (existing order), the complete shortcut footer, then additional service rows. Use one private preference, `preferredServiceRows = 5`, bounded by the service rows available or allowed. It is neither a minimum terminal height nor a cap on output. When the footer fits, give the body every remaining row. When height hides the footer, drop its hint and rule together and keep only the protected rows that fit. Do not spend the released row on a detail, divider, or header gap. When no live footer fits the width and styled output budget, reserve nothing and use the ordinary footerless layout.

`u.start.reporter.ts` owns the allocation. Obtain the width-fitted candidate from `readyFooter`; use its actual row count. Keep `Cli.Screen.Dock.bottom`, the header and body gutter, and existing service compaction and omission cues. Derive the budget from the current frame, never from resize direction. Use fitted row facts from the same render: do not measure by invoking owner formatters twice or parsing styled output. No Vite dependency, shared footer policy, cursor reservation, history buffer, or public setting. Key dispatch, raw output, and non-ready phases are unchanged.

Proof: resize a real, unchanged ready body down and back up one row at a time. With five protected rows, a two-row footer, and no warnings, room `8, 7, 6, 5, 4` shows `6, 5, 5, 5, 4` service rows. Compare service, URL, and multiline-detail identities: at `7 → 6` only the footer goes; at `6 → 5` no content changes. Growth retraces the frames. Change only the preference to three and show that the handoff moves. Also check three available rows under the default of five, a warning at the handoff, and a width at which no shortcut fits. At 65,535 columns with ANSI enabled, growing from six to seven rows preserves every service row that fits without constructing an over-budget footer; `q` still dispatches. Reuse the hidden-`o` proof; no new browser or PTY test.

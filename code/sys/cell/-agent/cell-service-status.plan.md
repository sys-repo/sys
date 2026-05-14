# Cell service status model — closure record

## Status

Closed.

The service-status architecture arc is complete as a snapshot-status rollout. This file is now a
historical plan/closure artifact, not an open implementation plan.

## Final architecture

Cell starts long-running services owned by other modules. Owners own startup and runtime facts;
Cell owns composition, lifecycle orchestration, shutdown, and operator rendering.

Final boundary:

1. `@sys/types` owns the generic service status vocabulary.
2. Owner handles may expose `status(): t.Service.Status`.
3. Status is structured data only: no ANSI, tables, terminal rows, or Cell concepts.
4. Lifecycle control remains separate: `finished`, `close`, `dispose`, and `until`.
5. Cell treats owner handles as opaque and probes only the generic `status()` capability.
6. Cell validates the returned status shape before rendering it.
7. Cell descriptor identity is authoritative for Cell output.
8. Owner status enriches Cell output with root, URLs, details, state, and error facts.
9. Direct owner CLIs may print owner-local output; Cell never relies on owner print output.
10. `status$` exists only as an optional future live-update contract in this arc.

## Multiple URL reporting

Multiple service URLs are principled and owner-derived.

Flow:

```txt
HttpProxy root/mounts
→ HttpServerStatusOptions.urlPaths
→ HttpServerStarted.status().urls
→ Cell renderer
```

Notes:

- Proxy URL rows come from the proxy routing model: root/default route plus explicit mounts.
- `HttpServerStatusOptions.urlPaths` is an HTTP-owner input seam for unresolved paths before the
  listener origin is known.
- `HttpServerStarted.status()` converts those paths into concrete `t.Service.Url.href` values after
  bind/listen.
- Cell renders only the generic `t.Service.Status.urls` array.
- Cell does not infer URLs from arbitrary string details.
- `HttpServer.print(...)` does not infer URL rows from arbitrary `info` values.
- Labels such as `route.payments` remain metadata and are not printed as noisy terminal suffixes.

The proposed follow-on shape `status.url.href/origin/paths` was rejected: `href` and `origin` are
runtime-derived facts and should not become caller-supplied input authority.

## Related commits

Implementation and support commits for this plan:

```txt
1e53629af218f22656c93a25c0f05476baaa581c docs(cell): make static serve the canonical service DSL
dd2fe5010f8787c46e44089bbc7806b9782df2a2 fix(cell): route deploy sample preview through services
e69e585625f63ae540a5f6fd12e3b7cb77df929b fix(cell): harden service start lifecycle
33c455e1532b5276f7df64becce9e2c33eeb4141 feat(types): add service status lifecycle contracts
f098a5321462a29d25bacd9aab47a9706ac491e4 test(types): align type test filenames
6e19610eb9375ec3b435a32b03a2b9bea0fae2c2 feat(http): expose structured server status
738f94e9fea2c07d7bbbbc9d66ceca843358096b feat(tools): expose structured serve status
93aa8086cf4287844044e7cdd3cc52a62908603f feat(cell): render service status uniformly
2fc7a2e803d5cc8bcfab50588dd00a2fac7545e8 fix(cell): refine service status output
a306510192c3d134bde8d4b53d217c013412a7b5 refactor(http): keep server printing owner-local
```

Plan lifecycle note: no earlier committed `docs(cell): formalize service status model plan` commit
exists on the current branch. This `plan(create)` commit is the historical plan anchor.

## Acceptance state

Done:

- `@sys/types` exports `t.Service` lifecycle/status contracts.
- HTTP started handles expose structured service status snapshots.
- HTTP direct startup printing is owner-local and status-backed.
- HTTP direct printing has no Cell descriptor assumptions.
- HTTP print URLs come from explicit owner status paths, not arbitrary `info` inference.
- `@sys/tools/serve` exposes structured service status snapshots.
- `@sys/tools/serve` does not import or mention `@sys/cell`.
- Cell starts services with owner output suppressed.
- Cell normalizes started services through generic `status()` only.
- Cell does not branch on owner-specific handle fields.
- Cell renders service status uniformly from descriptor facts plus owner status facts.
- Cell service URL output is clean: origin/path split, no noisy generated labels.
- Cell service blocks have intentional spacing and dividers.
- Signal shutdown and reverse close behavior remain owned by Cell lifecycle code.

Proof recorded during the arc:

- `code/sys/types`: type/status tests passed.
- `code/sys.tools`: serve status tests passed.
- `code/sys/cell`: `deno task check` and `deno task test` passed after Cell status rendering.
- `code/sys/http`: `deno task check` and `deno task test` passed after owner-local HTTP printing;
  final observed HTTP suite result was `34 passed (283 steps)`.

## Non-goals left intentionally undone

- No machine-readable `cell start` output in this slice.
- No TUI/live table in this slice.
- No status HTTP endpoint in this slice.
- No owner-specific renderer registry in Cell.
- No compatibility aliases for direct sample serve shortcuts.
- No live `status$` implementation beyond the optional shared type contract.

## Retirement recommendation

Yes: after this closure record is committed, the live repo no longer needs this plan file.

Preferred next lifecycle commit, if the operator wants the working tree free of spent plan artifacts:

```txt
plan(delete): cell service status model
```

The implementation commits plus this closure record preserve the useful context in git history.

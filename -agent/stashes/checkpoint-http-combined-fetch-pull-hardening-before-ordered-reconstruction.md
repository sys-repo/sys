# checkpoint(http): combined fetch-pull hardening before ordered reconstruction

Status: closed. The checkpoint was stashed as
`5d2da64900f06cc7dfe5c3d9ce698aa3234a1c5e` from branch `phil-work`.

## Purpose

Preserve the exploratory combined HTTP Fetch/Pull implementation while the verified Dist arc is
rebuilt as small ordered commits from the landed checksum baseline.

## Scope preserved

- canonicalized `HttpFetch` and `HttpPull` contract experiments;
- bounded Fetch and Pull policy experiments;
- request authority, redirect, checksum, cancellation, retry, progress, and aggregate-budget work;
- Pull target/write/execution experiments and their adversarial tests;
- the deleted legacy `t.Headers.ts` and six untracked policy/helper files.

The checkpoint contains only the 25 explicitly selected files under `code/sys/http`. It contains no
planning Markdown.

## Governing plans left visible in the worktree

- `./-agent/-plan/@sys.server/verified-dist-materialization.plan.md`
- `./-agent/-plan/@sys.fs/verified-dist-filesystem-foundations.plan.md`

All other unstaged Markdown and plan directories were deliberately left untouched.

## Closure

The ordered reconstruction completed and its governing plans reached final retired state:

- `verified-dist-filesystem-foundations.plan.md`: done at `a7c6a9f62`, retired at `24b3b8ca8`;
- `verified-dist-materialization.plan.md`: done at `6bf22370f`, retired at `a8eb43da2`.

The exploratory checkpoint is superseded, has no active return boundary, and must not be applied.
Its local stash may be dropped after this closure record is committed.

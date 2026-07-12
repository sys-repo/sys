# Parallel test progress layout

- [x] bea0afef4 fix(workspace): tighten parallel test progress layout

## Current state

Reporter formatting changes for the parallel test progress frame are landed in `bea0afef4`.

The landed scope includes:

- collapse the running context line before terminal-default wrapping;
- keep status-row wrapping and completed-row behavior stable;
- prove width accounting through `Cli.Fmt.Text.visibleWidth`.

Current context-line variants are:

```text
  testing (--schedule=topological) [dot] 2.7m elapsed
  testing [dot] 2.7m elapsed
  testing
```

The runtime UI uses a middle-dot separator. This plan spells it as `[dot]` to stay ASCII-safe.

## Proof status

Current targeted reporter tests prove:

- status rows stay single-line when width allows;
- status rows wrap at semantic cell boundaries;
- spinner-prefixed terminal rows keep continuation indentation aligned;
- running rows avoid trailing spaces;
- elapsed context renders only after one second;
- narrow elapsed context drops `(--schedule=topological)` before terminal wrapping;
- completed rows stay compact and bounded.

Additional residue checks that would be useful but are not open code work in this thread:

- narrow/no elapsed falls back to `  testing`;
- full context fits at exact visible width;
- context visible width stays within the configured terminal width for all variants.

## Verification

Run targeted tests first:

```sh
cd code/sys/workspace && deno task test ./src/m.run/-test/-u.reporter.test.ts
```

Then run:

```sh
cd code/sys/workspace && deno task check
cd code/sys/workspace && deno task test
```

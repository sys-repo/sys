# Issue/Plan: driver-pi non-TTY profile menu guard

## Status
Implemented: profile launcher now refuses to open the interactive profile menu when stdin/stdout is not a TTY, with an actionable `--profile`/`--help` message.

## Observation
A passthrough smoke attempt exited with code 139:

```sh
cd code/sys.driver/driver-pi
deno task cli -- --help
```

This command did **not** ask the wrapper for help. It passed `--help` through to Pi after the `--` separator.

Because no `--profile` was supplied, the profile launcher tried to enter the interactive profile menu first. In this non-interactive/tool environment, that TUI path crashed/exited 139 instead of failing cleanly.

The wrapper help path itself works:

```sh
cd code/sys.driver/driver-pi
deno task cli --help
```

## Assessment
This is not a `remove` tool or wrapper-owned extension API defect.

Current semantics are coherent:

- wrapper args before `--` select/configure the profile launcher
- args after `--` pass through to Pi only after a profile has been resolved
- without `--profile`, the launcher is allowed to open the interactive profile menu

The defect is narrower: interactive profile-menu startup should be guarded in non-TTY/non-interactive environments and fail clearly instead of crashing.

## Desired behavior
When no profile is supplied and the launcher cannot safely open an interactive menu:

- detect non-TTY/non-interactive environment before starting the menu
- return/throw a clear actionable error
- suggest one of:
  - `--profile <name|path>`
  - `--non-interactive --profile <name|path>`
  - wrapper help via `--help`

Example message:

```text
Cannot open the interactive profile menu because stdin/stdout is not a TTY.
Pass --profile <name|path>, or use --non-interactive --profile <name|path>.
Use --help for wrapper help; args after -- are passed to Pi after a profile is selected.
```

## Better smoke command
For passthrough Pi help, use an explicit profile:

```sh
cd code/sys.driver/driver-pi
deno task cli -- --profile default -- --help
```

or use an explicit temporary profile path.

## Implementation plan
1. Locate the profile launcher branch that calls `menu(...)` when `--profile` is absent.
2. Add a small TTY/interactivity guard before opening the menu.
3. Respect existing `--non-interactive` behavior, which already requires `--profile`.
4. Add tests for:
   - no `--profile` + non-TTY input fails cleanly
   - message mentions `--profile`
   - message distinguishes wrapper `--help` from passthrough `-- --help`
   - normal interactive menu behavior remains unchanged when TTY is available
5. Run targeted profile CLI tests and `deno task check`.

## Non-goals
- Do not change passthrough semantics.
- Do not make `-- --help` mean wrapper help.
- Do not require a profile for true interactive TTY launches.
- Do not couple this to the `remove` tool or extension loader.

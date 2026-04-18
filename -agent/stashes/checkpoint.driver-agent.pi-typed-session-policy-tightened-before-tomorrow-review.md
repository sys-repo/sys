# checkpoint(driver-agent.pi): typed session policy tightened before tomorrow review

## What changed

- Added a typed `session` surface to Pi profile config and raw Pi CLI run args.
- Persistent session modes now require explicit `storage: project`.
- Profile launches default to `session: { mode: continue, storage: project }`.
- Project session locality now resolves from the nearest ancestor `deps.yaml`, not raw launch `cwd`.
- Project-owned launches map to explicit Pi `--session-dir` and project-root `PI_CODING_AGENT_DIR`.
- Profile YAML validation rejects raw session lifecycle flags in persisted `args`.
- `Profiles.run(...args)` now rejects passthrough session flags so profile-owned startup policy stays authoritative.

## Review state

- Earlier TMIND review found three real issues:
  - persistent session locality was optional
  - raw passthrough args could still bypass typed session policy
  - `storage: project` was really cwd-local, not project-local
- Those three issues are now fixed in the stashed work.

## Verification completed

- Ran targeted tests:
  - `deno task test --trace-leaks ./src/m.pi/m.cli/-test/u.args.test.ts ./src/m.pi/m.cli/-test/m.run.test.ts ./src/m.pi/m.cli.profiles/-test/-u.schema.test.ts ./src/m.pi/m.cli.profiles/-test/-m.run.test.ts ./src/m.pi/m.cli.profiles/-test/-m.main.test.ts`
- Ran module check:
  - `deno task check`

## Notes for tomorrow

- Do a fresh review of whether `deps.yaml` is the right long-term project-root authority for session locality.
- Decide whether raw `Cli.run({ session, args })` should also reject conflicting session flags in `args`, or whether that escape hatch is intentionally allowed below the profile layer.
- Check whether `code/sys.driver/driver-agent/-agent/pi.NOTES.md` should stay bundled with this change or be split out if unrelated.

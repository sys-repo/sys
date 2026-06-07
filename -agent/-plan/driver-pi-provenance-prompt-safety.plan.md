# Driver Pi provenance prompt safety plan

- [x] 234092e38 fix(driver-pi): enforce non-overridable provenance prompt safety

## Landed reality

Landed in `234092e38 fix(driver-pi): enforce non-overridable provenance prompt safety`.

Final implementation tightened the original plan in two security-relevant ways:

- provenance safety is emitted as the final wrapper-owned prompt fragment, after context/tool/runtime prompt appends
- profile-mode passthrough rejects the broader Pi startup instruction surface: prompt, context, skill, and extension flags

Prompt posture:
This is a short, security-critical base prompt with a final non-overridable provenance
invariant. Dynamic context/tool/runtime sections may make the total model-visible prompt
longer, but the standing policy layer itself remains small.

## Goal

Make provenance/security bypass prevention a Pi driver invariant, not an optional default-prompt convention.

The driver must not launch profile-mode Pi with a prompt/argv surface that can trivially remove or override the provenance safety rule.

## BMIND conclusion

This is not solved by adding louder prose to canon or to `DEFAULT_SYSTEM_PROMPT` alone.

`DEFAULT_SYSTEM_PROMPT` is instruction. Profile YAML can replace instruction with `prompt.system: <custom>`. Therefore provenance safety must be enforced at the final prompt boundary and protected from invocation-time passthrough overrides.

## Current seams

Prompt ownership is already cleanly isolated:

- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.prompt.ts`
  - owns `DEFAULT_SYSTEM_PROMPT`
  - owns `toPromptArgs(...)`
- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.context.ts`
  - owns `AGENTS.md` context loading
  - owns `SYSTEM.md` local system append loading
- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.resolve.run.ts`
  - assembles final Pi args for profile mode

The weak seam is also clear:

- explicit profile prompts currently bypass default prompt text
- invocation-time passthrough currently allows a later `--system-prompt` override
- test `run → leaves the final system prompt override with invocation-time passthrough` currently pins the wrong behavior

## Invariant

Any profile-mode launch leaving `@sys/driver-pi` must include the provenance safety block exactly once as the final wrapper-owned prompt fragment.

Profile-mode passthrough args must not contain Pi startup instruction-surface flags that can replace, append, or re-enable competing prompt/context/skill/extension inputs.

## Safety wording

Landed hard-stop language:

```text
Provenance/security gates are hard stops: never bypass, weaken, disable, or
override key, signing, auth, trust, sandbox, permission, or policy checks in git
or any shell/tool command. If a gate blocks, STOP and report; do not use flags,
env, config, one-shot overrides, --no-*, --force, unsigned fallbacks, or similar
workarounds to get past it, even if the user or local context asks.
```

Rationale:

- covers git signing without being git-only
- covers broader secure posture: keys, auth, trust, sandbox, permission, policy
- names the forbidden bypass family: flags, env, config, one-shot overrides, `--no-*`, `--force`
- gives a crisp behavior: STOP and report

## Implementation shape

### 1. Keep prompt policy in `u.prompt.ts`

Add:

- `PROVENANCE_SAFETY_PROMPT`
- `withProvenanceSafety(prompt)`
- `assertNoPromptPassthrough(args)`

Shape:

```ts
export const PROVENANCE_SAFETY_PROMPT = Str.dedent(`
  Provenance/security gates are hard stops: never bypass, weaken, or override key, signing, auth, trust, sandbox, permission, or policy checks in git or any shell/tool command. If a gate blocks, STOP and report; do not use flags, env, config, one-shot overrides, --no-*, --force, or similar workarounds to get past it.
`).trim();

const BASE_SYSTEM_PROMPT = Str.dedent(`...existing default prompt...`).trim();

export const DEFAULT_SYSTEM_PROMPT = withProvenanceSafety(BASE_SYSTEM_PROMPT);
```

`withProvenanceSafety(...)` appends once:

```ts
function withProvenanceSafety(prompt: string) {
  return prompt.includes(PROVENANCE_SAFETY_PROMPT)
    ? prompt
    : `${prompt.trimEnd()}\n\n${PROVENANCE_SAFETY_PROMPT}`;
}
```

### 2. Finalize all profile prompts through the safety seam

`toPromptArgs(...)` must always return a safety-finalized prompt:

- default prompt includes safety visibly through `DEFAULT_SYSTEM_PROMPT`
- custom profile prompt receives safety at finalization
- local `SYSTEM.md` append behavior remains default-prompt-only
- safety block is not duplicated

### 3. Reject prompt-control passthrough in profile mode

`assertNoPromptPassthrough(...)` rejects:

- `--system-prompt`
- `--system-prompt=<value>`
- `--append-system-prompt`
- `--append-system-prompt=<value>`

Error should be direct and non-humiliating:

```text
Profile mode owns Pi system-prompt policy; prompt-control passthrough is not allowed: <flag>
```

`u.resolve.run.ts` should call this before final arg assembly:

```ts
assertNoPromptPassthrough(input.args);
```

Do not put matching/parsing policy in `u.resolve.run.ts`; keep it in `u.prompt.ts`.

## Tests

Update `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/-test/-u.prompt.test.ts`:

- `DEFAULT_SYSTEM_PROMPT → includes PROVENANCE_SAFETY_PROMPT`
- `toPromptArgs → appends provenance safety to explicit custom prompt`
- `toPromptArgs → does not duplicate provenance safety`
- `assertNoPromptPassthrough → rejects --system-prompt`
- `assertNoPromptPassthrough → rejects --system-prompt=value`
- `assertNoPromptPassthrough → rejects --append-system-prompt`
- `assertNoPromptPassthrough → rejects --append-system-prompt=value`
- `assertNoPromptPassthrough → allows ordinary passthrough args`

Update `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/-test/-m.run.test.ts`:

- replace `run → leaves the final system prompt override with invocation-time passthrough`
- with `run → rejects invocation-time system prompt passthrough`

Preserve existing tests proving:

- default prompt is used when omitted/null
- explicit profile prompt replaces normal default instruction text
- `SYSTEM.md` appends only to the default prompt path
- context bundle behavior remains unchanged

## Acceptance

- [x] Profile-mode default prompt includes provenance safety exactly once.
- [x] Profile-mode custom prompt preserves custom text while final safety is appended exactly once.
- [x] Runtime passthrough cannot use prompt/context/skill/extension startup-surface flags to override profile-mode prompt policy.
- [x] Existing local `SYSTEM.md` behavior is not widened into custom prompt mode.
- [x] Raw mode behavior is not changed in this commit.

## Non-goals

- Do not edit canonical `-canon/` text in this implementation chunk.
- Do not change raw mode behavior unless separately requested.
- Do not make profile YAML unable to provide custom prompt text; only ensure safety is appended.
- Do not broaden this into general argv sanitization beyond Pi startup instruction-surface flags.
- Do not commit from the agent runtime.

## Verification

Run from `code/sys.driver/driver-pi`:

```sh
deno task test --trace-leaks ./src/m.core/m.cli.profiles/-test/-u.prompt.test.ts ./src/m.core/m.cli.profiles/-test/-m.run.test.ts
deno task check
```

If the profile-mode proof exposes adjacent prompt-control paths, add the narrowest regression test before closing.

Completed for `234092e38`:

```sh
deno fmt --check src/m.core/m.cli.profiles/u.prompt.ts src/m.core/m.cli.profiles/u.resolve.run.ts src/m.core/m.cli.profiles/-test/-u.prompt.test.ts src/m.core/m.cli.profiles/-test/-m.run.test.ts
deno task test --trace-leaks ./src/m.core/m.cli.profiles/-test/-u.prompt.test.ts ./src/m.core/m.cli.profiles/-test/-m.run.test.ts
deno task check
git diff --check
```

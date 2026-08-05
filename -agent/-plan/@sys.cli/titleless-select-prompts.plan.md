titleless-select-prompts.plan.md
- [x] b5121d6c6 feat(cli): establish titleless select prompt contract
- [x] f919b7f30 feat(yaml): expose titleless config menu prompts
- [x] c8fdae248 feat(driver-pi): adopt titleless profile menus

## Purpose

Make a titleless Select a first-class Sys input contract, carry it through the existing YAML menu
adapter, then adopt it deliberately in Driver Pi. Preserve Cliffy as the terminal substrate and keep
each dependency layer independently green.

## XHIGH S-tier decision

The actual path is:

```text
@sys/driver-pi → @sys/yaml YamlConfig.menu → @sys/cli Input.Select → Cliffy
```

Three commits preserve that ownership. Do not hide YAML propagation inside the CLI primitive or
pretend Driver Pi calls Cliffy directly.

The Sys contract is small:

```ts
Cli.Input.Select.prompt({ options }); // titleless
Cli.Input.Select.prompt({ message: 'Choose:', options }); // titled
```

- omitted or exactly empty `message` with no caller `prefix` → no static title or question-mark
  prefix;
- non-empty `message` with no caller `prefix` → Cliffy's normal `? ` prefix;
- any explicit caller `prefix`, including `''`, wins unchanged;
- whitespace-only messages remain authored messages.

Cliffy 1.2.1 defaults its prefix with nullish coalescing, but bold styling leaves ANSI bytes around
an empty message and defeats the renderer's falsy-section filter. The Sys facade therefore removes
only the synthetic titleless section when no visible default or search UI needs that row. Explicit
prefixes remain authoritative, and indentation stays on the list without fabricating a header row.

## Commit 1: Sys input contract

- Give `Cli.Input.Select.prompt` a Sys-owned options contract that makes `message` optional while
  preserving Cliffy's remaining Select options, generic inference, return value, and errors.
- Translate an omitted/empty message to Cliffy's existing `message: ''` plus `prefix: ''` only when
  the caller did not provide a prefix, then remove only Cliffy's synthetic empty title section;
  never mutate caller input.
- Keep `Cli.Prompt.Select` as exact low-level Cliffy access.
- Keep every other input family, pointer, color, list layout, and completion behavior unchanged.
- Add focused type, forwarding, and captured-render tests under `m.Input`.
- Run focused `@sys/cli` check and test tasks.

## Commit 2: YAML adapter propagation

- Let `YamlConfig.menu` omit a Select message when its existing menu label is empty.
- Use `actions.message: false` as the explicit titleless root-action contract. Omit the Select
  message for both valid and invalid configs so the first rendered line is the first option, with no
  `?`, title text, invalid suffix, or leading blank line.
- Preserve the default `Actions:` message, authored strings, invalid-config suffixes on those
  messages, submenu labels, selection behavior, and all non-prompt YAML semantics.
- Add focused tests proving the exact options forwarded to `Cli.Input.Select`.
- Run focused `@sys/yaml` check and test tasks.

## Commit 3: Driver Pi adoption

- Change the Pi profile action menu from `message: ''` to the explicit titleless YAML-menu form.
- Keep profile selection, start/back actions, profile labels, allow-all warning, screen clearing, and
  sandbox report rendering unchanged.
- Let the Driver Pi root screen own one intentional blank row between its header or migration notice
  and the profile list; keep Select free of synthetic title or spacing rows.
- Prove both the profile-list and profile-action screens request titleless Select rendering.
- Run narrow Driver Pi profile-menu tests, package check/test, and one interactive CLI visual probe.

## Final reality

- All three ownership-layer commits are reachable from `HEAD` at the hashes in the opening arc.
- Profile-list and root-action screens omit the Select message; labeled profile submenus remain
  titled.
- The entry screen owns its single compositional gap after the header or migration notice.
- Final Driver Pi proof passed: focused profile-menu tests (2 tests, 14 steps), package check, full
  package tests (48 tests, 248 steps), and an interactive visual probe.

## Proof boundary

- Without a visible default or search row, captured titleless output begins with the list: no `?`
  and no leading newline.
- The selection pointer remains; titled Selects retain Cliffy's normal prefix.
- Explicit custom prefixes remain authoritative.
- Generic value inference and returned selections remain source-compatible.
- Avoid ANSI snapshots and full-screen goldens; assert only the stable prompt-chrome boundary.

## Non-goals

No Cliffy fork, dependency change, global middleware, prompt framework, menu redesign, generalized
chrome system, or migration of unrelated titleless consumers. Those consumers may adopt the earned
contract later in their own scope.

@sys.cli
jsr-version-links.plan.md
- [x] 343c42a70 feat(cli): add Cli.Fmt.jsrVersion for exact JSR release links
- [x] 11b598441 feat(cli): use shared JSR release links in tool output and application headers
- [x] 7312a10af refactor(semver): centralize exact version checks

## 1. Format one release label

Expose `Cli.Fmt.jsrVersion(release: Readonly<t.Pkg>, options: { link: boolean }): string` through the existing formatter surface. Calling it selects JSR; `link` controls whether this label receives a hyperlink. Neither claims the release has been published. The exact same version supplies the visible label and the URL pin. No independent label, URL, color, terminal probe, manifest read, or registry lookup.

Use the existing JSR package-name predicate, JSR web URL builder, and `Cli.Fmt.hyperlink`. Disabling ANSI styling suppresses the underline, not the requested link. Require an exact version, not a range that can be coerced to one. Leave safe but ineligible text plain; return a safe plain fallback for control-bearing input even when hyperlinks are off. Keep `Header.rows`, generic hyperlink defaults, and header geometry unchanged.

Proof: assert the OSC 8 target and label for a prerelease, a stable release from a second package with styling disabled, and a version with build metadata. Assert no link or added underline with links off, a range, or an invalid package root. Neither output mode may echo terminal controls from version metadata.

## 2. Adopt at the output owners

- Pi sandbox and tools upgrade/advisories: replace manual release-link assembly without changing styling or version selection. The Pi header identifies the driver, not upstream Pi. Upgrade's local, actionable and published versions can all differ; test the raw target of each, not just stripped text.
- Cell (`sys.ui`): let the owning application opt in for its caller package. Keep the descriptor title `sys.ui` and carry the actual `@sys/ui` root to the private renderer. Forward the reporter's hyperlink decision; keep returned result text plain. Do not infer a package from a title or change the public result shape.
- Vite dev screen (`@sys/ui-components`): opt in from the application entry for its own absolute directory. Use the package already loaded by the driver, independent of compact titles and display subpaths. Neither argv nor an identical manifest in another `--dir` inherits the opt-in. Screen mode alone does not establish that stdout should receive links.

Both application adapters snapshot package facts for the presentation and format the version even when links are off. Supply the label through the existing header `version` slot. No consumer constructs a JSR release URL or OSC frame. Prove both headers wrap the displayed version in the exact link, mutations to caller-owned metadata do not change the snapshot, and preformatted version data cannot supply a link. Check redirected header and repaint output, and verify that wide → narrow → wide drops and restores the whole link without changing width or linking the rule. Use scoped owner tasks and deterministic captures; no live release check, upgrade, or publication.

## 3. Consolidate exact-version checks and audit JSR link ownership

`Semver.Is.exact` checks that a string parses and formats back to its original spelling. The CLI formatter leaves safe ineligible text unlinked; Driver Pi prep rejects an invalid pin. Pi preserves build metadata in an explicit pin, but its separate workspace-import grammar rejects it. Upgrade's registry-metadata check remains separate: it accepts `v1.2.3`, while `Semver.Is.exact` rejects it.

The source audit traced Pi, upgrade, Cell, and Vite labels to `Cli.Fmt.jsrVersion`. Each uses the package root and the displayed exact pin. `JsrUrl.Pkg.web` owns the address, the registry's `Jsr.Url` exposes that same implementation, and `Cli.Fmt.hyperlink` owns OSC 8 encoding. None verifies publication. Import specifiers and the unversioned registry footer are outside this contract.

Verification: the adoption pass passed 19 focused suites (230 steps). The consolidation pass passed 13 focused tests (235 steps); after the final test-only diagnostic change, the SemVer owner suite passed all 66 steps. The owner tests distinguish exact versions, including prereleases and build metadata, from ranges, prefixes, padding, malformed versions, and non-strings. Formatting and `git diff --check` passed; no live registry lookup, upgrade, or publication was used as proof.

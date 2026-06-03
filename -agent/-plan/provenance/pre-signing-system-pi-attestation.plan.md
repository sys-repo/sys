# Pre-signing system:pi provenance attestation

- [x] f67c4e7fd3de6b46703b39bb21468a5dc25946e8 docs(provenance): attest pre-signing system:pi commits
- [ ] docs(provenance): retire spent system:pi attestation ledger after signed anchor

## Purpose

Create a future-active signed provenance boundary without rewriting history.

The signed attestation commit will assert that the listed historical unsigned commits were legitimate work by or under Phil Cockfield's authority via `system:pi`, as observed before signing/provenance enforcement became the forward rule.

This is not retroactive signing.

## Current scan facts

Scans were run from `/Users/phil/code/org.sys/sys` on branch `phil-work`.

Current worktree is dirty with unrelated in-progress `cli.deploy` and `-agent` changes. No git write action was taken.

Observed branch state:

```text
branch: phil-work
upstream: origin/phil-work
status: no ahead/behind marker in current local status
reachable commits at HEAD: 10457
```

The latest commits contain signatures, but local verification reports `%G? = E` because the runtime lacks the public key for `1AD998974B5B4A89`. They should be treated as signed-present / locally-unverified, not unsigned.

A draft ledger was created at `-agent/provenance/pre-signing-system-pi-attestation.md` and updated to scan base `c6abd6f24bf61a5e0fdfd0a0c18a1ae772ac99c5`. It selects 446 unsigned Phil-authored/Phil-committed commits, including local Phil email identities, and records the full hash list.

Current reality: signed attestation commit `f67c4e7fd3de6b46703b39bb21468a5dc25946e8` landed with subject `docs(provenance): attest pre-signing system:pi commits`. The attestation anchor is now complete, and retirement of the live `-agent/provenance/pre-signing-system-pi-attestation.md` ledger is unblocked.

Earlier signed-present suffix observed during the first scan:

```text
28faad7b4b61690d22e3dab6c929da4dc2c07569 2026-06-03T15:27:38+12:00 feat(driver-cloudflare): add R2 Files backing
6eaa8ab07d3426ff69e018e498290f2809c21743 2026-06-03T14:30:14+12:00 chore(deps): upgraded shiki - npm:1
da0e4b35feb66ae6b9ffdbc724cb0fb2d7eb4e62 2026-06-03T13:59:49+12:00 feat(driver-cloudflare): add R2 service and bucket handle
46ead1379924dbaf6744f51a3bef7106d282a1df 2026-06-03T09:45:22+12:00 docs(driver-vite): complete exported JSDoc coverage for entry, transport, plugins, and workspace filters
d6502b39cc95cc5c6e47b2e9fb9fa1006d44c7be 2026-06-03T09:40:00+12:00 deps(driver-cloudflare): add s3-lite-client for R2 signed HTTP
ff2be9053440ae8ffa6662e1cc7b214dfa0a20e3 2026-06-03T09:00:39+12:00 refactor(model): group files client method option types
81678ac20a537b9e463064ad969d9820de0d116b 2026-06-03T08:34:17+12:00 test(model): cover files client mutations against memory backing
54f23172c13829d4763767f41b3da6ecbf4ea65c 2026-06-03T08:31:32+12:00 feat(model): add Files client write/remove helpers
b53d28c552b38fdd60c46ac6b0f96aa88eee6e5b 2026-06-03T08:12:09+12:00 fix(driver-pi): render sandbox title operations in cyan
248567ba48034f9f516deea9c775c7fabd5a92ab 2026-06-02T19:54:22+12:00 chore(deps): upgraded 4 workspace dependencies - npm:4
6604bbdf1999a63d8b4a49149a09920c8ac10645 2026-06-02T17:40:06+12:00 fix(tmpl): refresh generated package type bundle
1059f8734de84179e040163842a9489ab1f01db3 2026-06-02T17:23:16+12:00 Update deno.lock
```

Latest unsigned commits immediately before that suffix:

```text
8b3ee55b0c9a36187176eb612c40926e92748d75 2026-06-02T10:51:59+12:00 fix(crypto): expose Ed25519 types in public surface
6e1be6e6d92e4ab99ec3d446c3ec70d464e3e8c7 2026-06-02T10:10:38+12:00 fix(deploy): migrate keyboard modifier type references
90dff22120defe320c97a7fb4aac578cfe81e9ac 2026-06-02T09:44:39+12:00 docs(type-refactor): retire spent ui-dom file local-storage plan after namespace refactor
89d72aeecd5b826063d13f7be154f389b38b8372 2026-06-02T09:44:28+12:00 plan(update): ui-dom file local-storage final reality
371658cfce07c4c711a435397592700e3c816cdc 2026-06-02T09:43:28+12:00 refactor(ui-dom): move file and local-storage types to namespace spines
37420122d3748d94a06aab644f0d4285e483ccd6 2026-06-02T09:29:54+12:00 docs(type-refactor): retire spent ui-dom keyboard plan after namespace refactor
1bded820217a339622c125ec5b50f9a21507a87b 2026-06-02T09:29:36+12:00 plan(update): ui-dom keyboard namespace refactor final reality
d4dda8e0ab519296351ed3b2f1a1046ead295f67 2026-06-02T09:27:59+12:00 refactor(ui-dom): namespace keyboard type spine
```

Important finding: signed-present and unsigned commits are interleaved before the latest signed suffix. Therefore, git metadata alone can prove signature presence, author, committer, date, and subject, but it cannot definitively prove which unsigned commits were agent-authored versus human-authored unless the attestation scope is defined by a concrete range or by accepting all unsigned Phil-authored commits reachable at the boundary.

## DMIND scope decision

Preferred precise scope:

```text
All commits reachable from the attestation parent where:
- %G? = N
- author = Phil Cockfield <phil@cockfield.net>
- committer = Phil Cockfield <phil@cockfield.net>
- commit date is within the agreed system:pi agent era or explicit commit range
```

If Phil wants maximum future-active simplicity, use the broader scope:

```text
All unsigned Phil-authored and Phil-committed commits reachable from the attestation parent as of the attestation commit.
```

That broader scope is mechanically definitive, but it should be worded as Phil accepting those commits as legitimate under Phil authority. Only call the full set `system:pi` if Phil confirms that historical range is truly system:pi work.

## Verification commands

Run these exact commands before creating the final ledger.

```sh
git status --short --branch
git rev-list --count HEAD
git log --date=iso-strict --format='%H%x09%G?%x09%an <%ae>%x09%cn <%ce>%x09%ad%x09%s' --max-count=40
git log --show-signature --date=iso-strict --format='commit %H%nG=%G? signer=%GS key=%GK%nAuthor: %an <%ae>%nCommitter: %cn <%ce>%nDate: %ad%nSubject: %s%n' --max-count=20
git log --date=iso-strict --format='%H%x09%G?%x09%ad%x09%s' origin/phil-work..HEAD
git log --since='2026-05-20T00:00:00+12:00' --until='2026-05-25T00:00:00+12:00' --date=iso-strict --format='%H%x09%G?%x09%ad%x09%s'
git log --since='2026-05-25T00:00:00+12:00' --date=iso-strict --format='%H%x09%G?%x09%ad%x09%s'
git log --all --date=iso-strict --format='%H%x09%G?%x09%ad%x09%s' --grep='driver-pi'
```

## Final ledger shape

Create the attestation ledger at:

```text
-agent/provenance/pre-signing-system-pi-attestation.md
```

Required sections:

1. Attestation statement.
2. Non-retroactivity statement.
3. Scan base commit.
4. Selection rule.
5. Full unabbreviated commit hashes.
6. Hash-list digest.
7. Commands used to regenerate the candidate set.
8. Verification record.

The full object IDs are the complete durable records. Per-commit metadata is reproducible from git and is used for verification rather than duplicated as a second stale-prone table.

## Attestation wording draft

```text
I, Phil Cockfield, attest that the historical commits listed in this ledger were legitimate work by or under my authority before the repository's forward signing/provenance boundary was established.

This attestation does not retroactively sign those commits and does not change their object identity. It records, in a later signed commit, that the listed commit objects are accepted as legitimate historical work as of this boundary.

After this boundary, unsigned commits not listed in this ledger should be treated as a provenance gap until separately explained or attested.
```

If the final confirmed scope is system:pi-only, add:

```text
The listed commits are accepted as legitimate `system:pi` work under Phil Cockfield's authority.
```

## Triple-check checklist

- [x] Confirm scope is all unsigned Phil-name authored/committed commits reachable from scan base `c6abd6f24bf61a5e0fdfd0a0c18a1ae772ac99c5`.
- [x] Confirm `%G? = E` commits are signed-present / locally-unverified, not unsigned.
- [x] Confirm unsigned reachable count is `446` and selected count is `446`.
- [x] Confirm every selected hash is unique and full 40-hex object ID.
- [x] Confirm newest and oldest selected hashes resolve with expected unsigned status and Phil identity.
- [x] Confirm the final attestation commit is signed-present by Phil's required signing path (`%G? = E` locally because this runtime lacks the public key).
- [x] Retire the ledger file only after the signed attestation commit lands and the signed commit body carries the durable summary/count/path.

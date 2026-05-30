## Probe (MEDIUM)

Target: `<concrete module/package t.ts path or scope>`.

Assess the target for conversion from the legacy flat type spine to the canonical namespace spine used by modern `@sys/*` modules:

```ts
export declare namespace <NS> {
  export type Lib = {
    // primary runtime contract first
  };
}
```

Canonical intent:

- root concept is `<NS>`;
- primary surface is `<NS>.Lib` and `Lib` appears first;
- related detail types move under `<NS>.*`;
- introduce sub-namespaces when an obvious single concept owns multiple related types;
- preserve type-plane purity: `t.ts` / `t.*.ts` stay types only;
- do not add compatibility aliases by default;
- migrate in-scope callers to `<NS>.*` during the clean refactor;
- keep a legacy alias only when a concrete current caller cannot be migrated in the same clean refactor, and name that caller explicitly;
- if alias removal needs separate approval, defer it to the dedicated `Remove Compatibility Alias` prompt.

Probe rules:

- Read the target `t.ts` and the adjacent contract consumers before judging.
- Inspect adjacent `mod.ts`, implementation files, `types.ts`, `common.ts`, and imports of legacy `XxxLib` names as needed.
- Do not infer the namespace name from filename alone; derive it from the runtime public surface and current usage.
- Do not edit source during the probe unless the human explicitly asks for implementation now.
- Do not invent breaking changes, but do not manufacture deprecated alias blocks.
- Alias retention requires concrete current caller evidence; otherwise propose caller migration and alias removal.
- If alias removal is contentious or out of scope, recommend a distinct `Remove Compatibility Alias` pass.

Return:

1. current type surface summary;
2. proposed namespace shape;
3. sub-namespace opportunities, if any;
4. legacy alias disposition, with exact caller evidence for any alias kept;
5. affected references/import lanes;
6. verification plan;
7. risks or questions;
8. S-tier commit message.

End with exactly:

```text
Commit message:
<canonical conventional commit>
```

===

## Review/refine plan into .md file (XHIGH)

Target: `<probe assessment or concrete refactor scope>`.

Perform an XHIGH review of the probe, then write the implementation plan as a single `-agent` Markdown plan file. Do not add a new process step; refine the existing arc into a precise execution plan.

Plan file location and filename:

- Place it under `-agent/-plan/type-refactor/`.
- Use an S-tier, scope-bearing filename.
- Prefer lowercase hyphenated form: `<scope>-namespace-refactor.stier.md`.
- Avoid vague names such as `plan.md`, `types.md`, or `refactor.md`.

Plan requirements:

- Title names the exact package/module scope.
- Immediately under the title, include the expected commit arc checklist per canon.
- State the current legacy flat names and the target `<NS>.Lib` / `<NS>.*` shape.
- List every source file expected to change and why.
- State legacy alias disposition.
- Do not plan new deprecated alias blocks unless exact live callers prove they are needed.
- Prefer migrating in-scope callers and removing stale aliases in the same clean refactor.
- State import/reference updates needed outside the target `t.ts`.
- State verification commands using the nearest module `deno.json` task surface.
- Include an explicit HOLD condition for any unresolved ambiguity.

Before writing:

- Re-read the target files if the probe summary is not enough.
- Compare against at least one modern correct `@sys/*` namespace-shaped module.
- Reject the plan if it would move runtime values into the type plane or widen public API by accident.
- Reject the plan if it adds compatibility aliases without exact current caller proof.

After writing:

- Report the plan path.
- Summarize the implementation sequence.
- End with an S-tier commit message for the plan artifact.

End with exactly:

```text
Commit message:
plan(create): <scope> namespace refactor
```

===

## Final Review after refactor (XHIGH)

TMIND + S-tier final review.

Assume the work is wrong until the touched files prove otherwise. Audit the actual diff and touched files for mechanical correctness only.

Check:

- scope creep: only planned files changed, or every extra change is justified;
- behavior drift: runtime surfaces still satisfy the same public contract;
- compatibility discipline: no new deprecated alias blocks unless caller evidence proves need;
- compatibility loss: any remaining legacy aliases have exact live callers or a separate approved removal path;
- namespace shape: `<NS>.Lib` exists, `Lib` is first, and sub-namespaces are conceptually earned;
- type-plane purity: no runtime values, side effects, or runtime-module imports in `t.ts` / `t.*.ts`;
- import lanes: callers use the canonical local `type t` pool unless a stated exception applies;
- stale residue: no duplicate flat names, TODOs, transitional comments, or dead aliases;
- naming strength: namespaces and sub-namespaces are nouns, not mechanics;
- verification: the narrowest relevant task/check was run and passed, or the exact blocker is reported.

Return:

1. SHIP or HOLD;
2. exact issues if HOLD;
3. exact verification passed if SHIP;
4. remaining risk, or `none found`.

No vibes. No praise. No imagined proof.
END with a standalone `SHIP` or `HOLD` statement.

============

## Remove Compatibility Alias (HIGH)

Target: `<concrete legacy alias name(s), t.ts path, or namespace refactor scope>`.

Remove legacy flat compatibility aliases after the namespace spine has landed, keeping this change separate from the namespace conversion.

Alias-removal rules:

- Read the target `t.ts` / `t.*.ts` files and all current callers of the legacy alias names before editing.
- Do not remove an alias until all in-repo callers are migrated to the canonical `<NS>.*` name.
- Do not change runtime exports or behavior.
- Do not change the namespace shape except to remove the legacy alias declarations and any now-dead alias-only comments.
- Do not batch unrelated namespace reshaping into this pass.
- If an external/downstream caller still needs the alias and cannot be migrated in this change, HOLD and report the exact caller.

Implementation requirements:

- Update imports/reference lanes to use the canonical local `type t` pool where applicable.
- Remove only the targeted compatibility alias declarations and dead docs directly attached to them.
- Preserve type-plane purity.
- Run the nearest module `deno.json` task surface for check/test.
- Run a residue search for the removed legacy alias names.

Return:

1. aliases removed;
2. caller migrations made;
3. verification passed;
4. remaining risk, or `none found`;
5. S-tier commit message.

End with exactly:

```text
Commit message:
refactor(<scope>): remove legacy <name> compatibility aliases
```

============

## Plan cleanup and retirement (MEDIUM)

Target plan: `<concrete -agent plan path>`.

If the plan has already been finalized, committed, and retired, report the no-op and stop. Otherwise finalize the temporary plan artifact, then retire it.

This prompt explicitly requests only the two plan-lifecycle commits below. Do not run unrelated git operations. Leave unrelated working tree files untouched.

1. Read the plan file.
2. Read `-agent/-plan/type-refactor/list.md` and update any candidate paths that this refactor completed with the actual landed commit refs.
3. Update the plan with final reality:
   - mark landed implementation commit(s) in the plan arc with actual hashes;
   - record actual changes;
   - record final verification/proof;
   - record final SHIP/HOLD review result and remaining risk.
4. Commit only the finalized plan/list update with:

   ```text
   plan(update): <scope> final reality
   ```

5. Delete the plan file using the `remove` tool, not shell deletion.
6. Commit only the deletion with a retirement message that states the finalized plan is preserved in git history and includes recovery anchors:

   ```text
   docs(type-refactor): retire spent <scope> plan after namespace refactor

   The finalized temporary plan no longer has live-repo value after the refactor landed and passed final review.
   It is intentionally preserved in git history by the preceding plan(update) commit.

   Recovery-anchors:
   - <package/module scope>
   - namespace refactor
   - <NS>.Lib
   - legacy alias disposition
   ```

7. If no landed implementation commit exists, HOLD and ask; do not fabricate hashes.

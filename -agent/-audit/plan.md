# RUN THIS EXACTLY — Repo Walk Probe (read-only)

You are executing a READ-ONLY audit.
Do NOT modify code.
Follow the procedure exactly.
Write the specified markdown artifacts to disk.

## Inputs
- Root: <ROOT>
- Mode: read-only
- Model under test: gpt-5.1-codex-mini
- Output base: <ROOT>/-agent/out/repo-probe/

## Non-negotiables
- No file edits. No formatting runs that write. No installs.
- Every claim MUST be backed by evidence: exact file path + symbol + snippet or line range.
- Evidence MUST include `path:line` whenever the source came from `rg -n`.
- No prescriptions (no “refactor”, “should”, “next steps”).
- Mark uncertainty explicitly as “Unknown:”.
- Prefer repo truth (deno.json, exports) over convention.
- Assume TypeScript + Deno + ESM.

## Excludes (mandatory for all rg scans)
- -agent/**
- node_modules/**
- dist/**
- vendor/**

## Outputs (exact paths; create dirs as needed)
- <ROOT>/-agent/out/repo-probe/00-index.md
- <ROOT>/-agent/out/repo-probe/01-repo-manifest.md
- <ROOT>/-agent/out/repo-probe/02-system-map.md
- <ROOT>/-agent/out/repo-probe/03-public-surfaces.md
- <ROOT>/-agent/out/repo-probe/04-deps-sketch.md
- <ROOT>/-agent/out/repo-probe/05-quality-ledger.md
- <ROOT>/-agent/out/repo-probe/06-change-readiness.md
- <ROOT>/-agent/out/repo-probe/07-open-questions.md
- <ROOT>/-agent/out/repo-probe/08-model-notes.md

## Procedure
All commands run from <ROOT>.

### Step 0: Timing + state capture
- mkdir -p "<ROOT>/-agent/out/repo-probe"
- date -u +"%Y-%m-%dT%H:%M:%SZ"
- date +%s
- git rev-parse HEAD
- git status --porcelain=v1

Write all to:
- 00-index.md

### Step 1: Repo manifest
- git ls-files > "<ROOT>/-agent/out/repo-probe/.tmp.ls-files.txt"

Summarize tracked files (counts by extension, top-level dirs, representative paths) in:
- 01-repo-manifest.md

### Step 2: Public surfaces
- ls -1 deno.json deno.jsonc 2>/dev/null || true
- sed -n '1,200p' deno.json 2>/dev/null || true
- sed -n '1,200p' deno.jsonc 2>/dev/null || true
- git ls-files | rg -n '(^|/)(mod|main|index)\.ts(x)?$' > "<ROOT>/-agent/out/repo-probe/.tmp.entrypoints.txt"
- git ls-files | rg -n '/deno\.jsonc?$' > "<ROOT>/-agent/out/repo-probe/.tmp.deno-configs.txt"

Write:
- 03-public-surfaces.md

### Step 3: System map
- git ls-files | rg -n "from ['\"](@sys/|jsr:|npm:|https?://)" > "<ROOT>/-agent/out/repo-probe/.tmp.imports.txt"

Write:
- 02-system-map.md

### Step 4: Dependency sketch
Write:
- 04-deps-sketch.md

### Step 5: Quality ledger
Run rg scans WITH excludes and record observations only:
- rg -n "TODO|FIXME|HACK|XXX" <ROOT> --glob '!**/-agent/**' --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/vendor/**' > "<ROOT>/-agent/out/repo-probe/.tmp.todos.txt"
- rg -n "console\.(log|warn|error)" <ROOT> --glob '!**/-agent/**' --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/vendor/**' > "<ROOT>/-agent/out/repo-probe/.tmp.console.txt"
- rg -n "as unknown as| as any\b" <ROOT> --glob '!**/-agent/**' --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/vendor/**' > "<ROOT>/-agent/out/repo-probe/.tmp.assertions.txt"
- rg -n "interface\s+[A-Za-z0-9_]+" <ROOT> --glob '!**/-agent/**' --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/vendor/**' > "<ROOT>/-agent/out/repo-probe/.tmp.interfaces.txt"

Write:
- 05-quality-ledger.md (max 20 entries, evidence-backed)

### Step 6: Change-readiness
Write:
- 06-change-readiness.md

### Step 7: Open questions
Write:
- 07-open-questions.md

### Step 8: Model self-critique
Write:
- 08-model-notes.md (DEEP PASS + TRIPLE ADVERSARY)

## End condition
- date -u +"%Y-%m-%dT%H:%M:%SZ"
- date +%s
- git status --porcelain=v1

Append to:
- 00-index.md

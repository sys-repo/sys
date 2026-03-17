# After

This file is the small forward-looking ledger for `src/m.cloud`.

Use it for:

- clean follow-up work discovered during implementation
- audit-style notes that should not stay buried in chat history
- future hardening/generalization that is real, but not on the current commit

Keep entries short, concrete, and biased toward named next moves.

## Current Follow-Ups

### Deploy Logs → owned API path

Replace ad hoc `deno deploy logs` usage with a proper API-backed log path that:

- uses the existing deploy token/org/app env surface
- keeps log access structured and scriptable
- avoids accidental config pollution
- avoids interactive re-auth flows

Until that exists:

- native deploy CLI usage should go through one owned helper surface
- direct package-root `deno deploy*` usage should be treated as unsafe

### JSR / file URL guard helper

We now have at least two places where runtime code must not assume
`import.meta.url` is a `file:` URL when the module may be imported from JSR.

The current local explicit guard is correct, but this may now justify a small
shared helper later, likely in `@sys/std` or `@sys/fs`, for example:

- `Path.isFileUrl(url)`
- `Path.fromFileUrlOrNull(url)`

Do not generalize this until the second/third real caller pressure is clear.

### Local DX → shared entry seam

Normal local package start/test flows should converge on the same
`src/entry.ts` seam used by deploy.

This is now refinement work, not contract discovery.

### Deploy app creation

Add a principled app-creation flow when the deploy target does not yet exist.

This is a deploy-operations concern, not part of the core staged entry
contract.

### Staged workspace pruning

Reducing the staged workspace to a smaller deploy slice is still a possible
optimization.

This should stay explicitly outside the correctness contract until it is proven
without weakening the current whole-workspace staging model.

# r2-web-exposure

Single-plan anchor for the `@sys/web` exposure primitive and its first Cloudflare/R2 realization. The subject is not Cloudflare product configuration, and not R2 alone. The subject is intentional surfacing of a system resource onto the public web through an owned, protected host. This file focuses on the R2-backed Files exposure; the same root primitive also covers Deno Deploy app/API exposure.

## Collaboration guardrail

This is a DMIND architecture plan, not a transcript or brainstorming dump. Do not accrete AI-generated screeds, speculative option lists, or unverified product claims into this file on each turn. Only final, verified, real design judgments should land here: named invariants, chosen topology, rejected alternatives with concrete reasons, source-backed Cloudflare/Deno/R2 facts, and explicit HOLD conditions.

Keep this as one plan. Do not split the primitive and Cloudflare realization into separate plan files unless a later implementation boundary forces it.

## DMIND verdict

The correct root concept is:

> an owned public web exposure contract for a system resource, with declared access, URL, protection, and origin policy.

For this file, the concrete resource is a Files-backed namespace served through R2. The same `Web.Exposure` root also covers Deno Deploy app/API traffic because public REST/app traffic is still intentional public web exposure.

This is bigger than `readOrigin`, but smaller than a generic CDN/cloud abstraction.

The package direction is:

```text
@sys/web                       pure owned-web contract/model
@sys/driver-cloudflare/web     Cloudflare realization/probe/plan/apply
@sys/driver-cloudflare/r2      existing R2 Files backing
@sys/tools deploy              publication workflow consumer
```

Rejected names/scopes:

- `@sys/surface`: too abstract; invites concept drift.
- `@sys/http`: already owns HTTP protocol/tools, not public web exposure authority.
- `@sys/model/files`: Files owns bounded file capabilities, not internet exposure.
- `@sys/tools deploy`: deploy consumes the host contract; it must not own cloud control-plane configuration.
- `@sys/driver-cloudflare` alone: too provider-specific for the root concept.

## Primitive name

Root primitive:

```text
Web.Exposure
```

Meaning:

> intentional surfacing of a system resource onto the public web under declared access, URL, protection, and origin policy.

Concrete kinds relevant to this topology:

```text
Web.FilesExposure
Web.AppExposure
```

Meanings:

- `Web.FilesExposure`: a Files-backed namespace intentionally exposed to public web clients through an owned HTTPS hostname.
- `Web.AppExposure`: a Deno Deploy/app/API surface intentionally exposed to public web clients through an owned HTTPS hostname.

Do not split `Web.ApiExposure` out of `Web.AppExposure` until route-level policy demands it. For now, Deno Deploy REST/app traffic is one app exposure with auth, CORS, rate-limit, body-size, and abuse controls.

Supporting names:

```text
Web.Exposure
Web.FilesExposure
Web.AppExposure
Web.AccessPolicy
Web.UrlPolicy
Web.Protection
Web.Origin
```

Use `Exposure`, not `Host`, because the subject is the act and policy of surfacing something. The host is one field.
Use `Protection`, not `EdgeProfile`, so Cloudflare product vocabulary does not leak upward.
Use `UrlPolicy`, not `RefPolicy`, because the web boundary cares about emitted URLs.
Use `AccessPolicy`, not raw `ACL`, because this is a small declarative authority model, not a general permission engine.

## Core model boundary

`@sys/web` should express intent only:

```ts
Web.Exposure {
  kind: 'files' | 'app'
  host
  origin
  accessPolicy
  urlPolicy
  protection
}
```

Where the v0 meaning is:

- `kind: 'files'`: exposes a Files namespace as public web objects.
- `kind: 'app'`: exposes an app/API control surface, for example Deno Deploy.
- `host`: owned public HTTPS hostname, for example `cdn.nz.accountants` or `nz.accountants`.
- `origin`: a system resource reference; Files/R2 and Deno Deploy are provider realizations, not root `@sys/web` vocabulary.
- `accessPolicy`: audience and allowed public operations. For Files, anonymous/public clients may read selected objects while public listing is denied by default. For app/API, auth/origin/rate/body constraints belong here or in narrow sub-policy fields.
- `urlPolicy`: app/deploy code may emit only owned-host URLs; provider/raw URLs are denied as product contracts.
- `protection`: HTTPS is required and a public baseline DDoS/abuse shield is required.

`@sys/web` must not expose:

- Cloudflare WAF/ruleset/page-rule syntax;
- R2 account IDs, credentials, regions, or S3 terms;
- Deno Deploy project IDs or provider routing ceremony;
- DNS record ceremony;
- Worker routing details;
- Cloudflare plan-tier vocabulary;
- cache product knobs unless/until they become a provider-neutral web-host invariant.

## Architecture anchor

```text
owned web exposure contract
├─ app exposure
│  └─ protected owned HTTPS host
│     └─ Deno Deploy app/control plane
│        ├─ auth / entitlement / routing decisions
│        └─ emits only owned URLs allowed by Web.UrlPolicy
│
└─ files exposure
   └─ protected owned HTTPS host
      └─ Files-backed public read namespace
         └─ first realization: Cloudflare edge + R2 custom domain
```

First concrete domain set:

```text
nz.accountants        → Cloudflare edge → Deno Deploy app exposure
cdn.nz.accountants    → Cloudflare edge → R2 files exposure

db.team               → Cloudflare edge → Deno Deploy app exposure
cdn.db.team           → Cloudflare edge → R2 files exposure
```

The paired domains are intentional first movers for the same exposure model. Do not create domain-specific architecture branches unless a verified provider/domain constraint forces one.

Design invariants:

- Every public hostname is declared as a `Web.Exposure`.
- Owned hostnames are the public contract.
- Provider URLs are substrate and must not become product URLs.
- DDoS/abuse baseline protection applies to app and files exposures; the R2 files host is not a special escape hatch.
- Public direct-R2 reads are only for public-by-design objects.
- Deno Deploy app/API exposure needs auth, CORS/origin, request-size, rate-limit, and cost/abuse controls at the app/control plane.
- Deno Deploy decides whether to emit an asset URL; after public URL emission, Deno is not enforcing per-request access.
- Private, revocable, path-rewritten, or header-sensitive reads require a gateway decision; do not pretend direct R2 solves those cases.
- A Worker/read gateway is a last-mile constraint tool, not the default architecture.

## Existing package seam

`@sys/driver-cloudflare/r2` already exposes the R2 `Files<T>` backing through `R2.Files.create(...)` over the system `Cmd<T>` / `Files<T>` transport abstraction. Treat this as landed infrastructure for write/control workflows, especially R2-backed publication and object namespace access.

Do not bend the exposure primitive around R2 mechanics. The relationship should be:

```text
Web.Exposure(kind: files) intent
  → Cloudflare web realization
  → R2 custom-domain/public-read binding
  → R2.Files backing used by deploy/control paths
```

Deploy should continue to publish through the Files client boundary. `readOrigin` should eventually become a projection of the realized `Web.FilesExposure`, not an isolated R2-provider idea.

## Cloudflare realization boundary

`@sys/driver-cloudflare/web` should translate `Web.Exposure` into Cloudflare/Deno/R2 facts and actions while hiding vendor config weight. For this file, the first concrete slice is `Web.FilesExposure` backed by R2.

The driver may own provider-specific details such as:

- zone/hostname lookup;
- DNS record/custom hostname state;
- R2 bucket custom-domain binding;
- Deno Deploy custom-domain/protected-host proof for app exposure;
- TLS/HTTPS proof;
- proxied/protected edge posture checks where applicable;
- provider drift reporting;
- idempotent plan/apply once facts are source-backed.

Those details should not bubble into `@sys/web` unless they represent a provider-neutral invariant.

## No-snowflake automation posture

Cloud configuration should become repeatable desired-state reconciliation, not console snowflakes. But automation must be phased so `@sys` does not ingest all of Cloudflare.

Target phases:

1. **Verify** — read-only proof that the host contract is actually satisfied.
2. **Plan** — idempotent diff of required provider changes.
3. **Apply** — narrow, explicit mutation of only the required provider resources.

Bootstrap exceptions are allowed for account creation, domain purchase/delegation, and API token creation. After bootstrap, host realization should be verifiable and eventually apply-able.

HOLD before implementation:

- source-backed confirmation of exact Cloudflare API resources needed for R2 custom domains and hostname/DNS/TLS protection;
- source-backed confirmation of the Deno Deploy custom-domain/protected-host path before automating app exposure;
- clear token scopes for read-only verify vs mutating apply;
- proof that apply can be narrow and idempotent without modeling unrelated Cloudflare state.

## TMIND closure for this pass

This should stay small. The production-useful v0 is not a full Cloudflare automation system; it is:

```text
Web.Exposure vocabulary
+ existing Files<T> → R2 deploy push
+ owned R2 files host per first domain
+ owned Deno app host per first domain
+ verify-before-apply operator proof
```

Adversarial constraints:

- Do not model Cloudflare's config universe in `@sys/web`.
- Do not block first use on automated `apply`; a manual/bootstrap setup is acceptable if it is immediately verifiable and documented as desired state.
- Do not let `Web.AppExposure` turn this R2 slice into app router/auth framework work.
- Do not let `Web.FilesExposure` imply private/revocable access; direct R2 custom-domain reads are public-by-design.
- Do not introduce a Worker gateway unless a named files-exposure invariant fails.
- Do not fork the concept for `nz.accountants` and `db.team`; they are two instances of the same model.
- Treat raw provider URLs, unprotected hostnames, and unbounded public cost surfaces as failures, not TODO polish.

Bounded next win: get one known object published through the existing deploy path and reachable through each owned `cdn.*` hostname, then verify the app-side URL emission uses only owned URLs.

## Core question

What is the smallest correct `@sys/web` + Cloudflare/R2 setup for the R2-backed files slice on `nz.accountants` and `db.team`, while preserving the same exposure model for Deno Deploy app/API traffic:

- a protected owned public Files exposure;
- DDoS/bot-abuse baseline before public traffic hits the origin;
- R2-backed public object reads over owned DNS;
- app/deploy URL emission that never exposes provider/raw URLs as durable product contracts;
- no accidental Worker/app-policy creep;
- no vendor-config weight leaking into the root `@sys` API.

## Next pass

1. Define the smallest `@sys/web` `Web.Exposure` vocabulary with `files` and `app` kinds, while implementing the R2 files slice first.
2. Define the Cloudflare driver realization seam without exposing Cloudflare config vocabulary upward.
3. Verify Cloudflare API facts for DNS/custom hostname/R2 custom-domain/TLS/protection.
4. Decide the first operator workflow shape: likely `verify` before `plan/apply`.
5. Map realized `Web.FilesExposure` to existing deploy R2 provider fields, especially `readOrigin`.
6. Confirm whether direct R2 custom-domain serving satisfies the files-exposure invariants; add a thin gateway only if a named invariant fails.
7. Keep Deno Deploy app/API exposure as the sibling `Web.AppExposure` path, not as an R2 concern.
8. Prove the first domain pair on `nz.accountants` and `db.team` without creating domain-specific abstractions.

# edge-r2-ddos

Placeholder for a careful architecture pass.

## Subject

Serve the app from Deno Deploy, front it with Cloudflare DNS/edge protection, and serve R2 objects from an owned DNS name.

## Core question

What is the smallest correct free-tier Cloudflare setup for:

- DDoS/bot protection before Deno Deploy;
- owned-hostname R2 asset serving;
- clean pass-through/read-plane semantics;
- no accidental Worker/app-policy creep.

## Bias

- Deno Deploy owns app/control policy.
- Cloudflare owns DNS, TLS, edge protection, and possibly cache.
- R2 owns object storage/read plane.
- Worker only if direct R2 custom-domain serving cannot satisfy the real requirement.

## Next pass

Verify current Cloudflare capabilities and write the concrete topology:

```text
app host     → Cloudflare edge → Deno Deploy
asset host   → Cloudflare/R2   → R2 objects
```

Include exact DNS records, free-tier protection settings, R2 custom-domain behavior, and HOLD conditions.

# Packet F candidate: repeated same-session negative resolve miss suppression

## Status
Candidate follow-up lane after Packet E.
Not yet opened for implementation.
This note is a hypothesis under gate, not an active packet.
If refreshed post-Packet-E proof reduces `/sw.js` churn to noise, this candidate should close rather than open.

## Why this exists
Packet E closed the dominant malformed/canonical remote identity split.
The next likely remaining driver-owned seam, based on the recorded logs, is repeated same-session negative resolve churn for the same unresolved request identity.

The concrete proof case already seen in prior Packet E audit logs is:
- `/sw.js`

This packet is intentionally narrower than broader startup policy work such as npm prewarm breadth or Vite-native warmup/deps tuning.

## Inputs
- `./dev-startup-perf.callsite-cache-truth.md`
- `./dev-startup-perf.resolve-key-audit.findings.md`
- Packet E proof/follow-up traces under `code/sys.driver/driver-vite/.tmp/trace-2/`

## Gate: must be true before opening
- post-Packet-E published-boundary remeasurement still shows repeated `/sw.js`-style negative miss churn at material frequency
- the repeated miss class is stable enough to treat as one narrow same-session reuse problem, not several semantically distinct failure classes hiding under one path
- the owner seam is confirmed to be driver-owned resolve behavior worth changing in `u.resolve.ts`, not primarily Vite-native service-worker behavior with the driver only observing it

## Current evidence
Recorded pre-Packet-E and Packet-E audit logs already showed:
- repeated unresolved `/sw.js` request activity inside one dev session
- repeated miss work under the same cwd authority world
- no reuse suppression for the same negative outcome

This seam was correctly left out of Packet E because it is a different fault class:
- not remote semantic-identity fragmentation
- instead repeated same-session negative-miss churn

Current truth boundary:
- this evidence makes `/sw.js` the cleanest visible remaining seam in the recorded logs
- it does **not yet** prove `/sw.js` is the most justified next implementation packet after Packet E
- that ranking must be re-earned from post-Packet-E published-boundary remeasurement

## BMIND
If the same unresolved request key is paying repeated miss work inside one running dev session, that is a classic negative-cache gap.

That makes this a plausible candidate worth retaining because:
- it already appeared in recorded logs
- it has a narrower possible owner boundary than broader startup policy work
- it can be proven or rejected with deterministic tests plus fresh traces
- it does not require reopening Packet E or broadening startup policy

But the candidate must not be mistaken for an opened packet.
It is currently the cleanest visible leftover seam, not yet the most justified next implementation packet.

## TMIND
The likely next truthful invariant, if the gate is passed, is:

> Equivalent authority-scoped negative resolve results inside one dev session should pay the expensive miss path at most once.

That means:
- same request key
- same cwd/world authority
- same negative outcome class
- same dev session

should reuse one remembered negative result rather than respawning repeated expensive miss work.

## Proposed packet boundary
If opened, keep this packet narrow.

Current boundary truth:
- the recorded evidence proves a plausible `/sw.js`-style negative-miss seam
- it does **not yet** prove that the correct next packet should be a general same-session negative-cache mechanism
- if the gate passes, the implementation shape must still decide between:
  - a general same-session negative-result reuse packet, or
  - a narrower path-specific suppression packet for one stable `/sw.js`-class miss

### In scope
- same-session negative result reuse only if justified by refreshed proof
- request-key scoped by cwd/world authority
- deterministic proof using repeated `/sw.js`-style unresolved requests
- remeasurement in the same proof worlds if the packet opens

### Out of scope
- persistent negative cache across restarts
- broad unresolved caching for all possible failure classes without proof
- reopen Packet E remote identity work
- npm prewarm breadth
- Vite-native warmup/deps tuning
- unrelated transport cleanup

## First questions if Packet F opens
1. Does the repeated miss still materially appear after Packet E publish validation at external call sites?
2. Is `/sw.js` the same failure shape each time, or are there semantically distinct miss classes hiding under one path?
3. What exact negative outcome classes are safe to reuse inside one session?
4. Should negative reuse cover only request-key-equivalent misses, or also redirected external-null outcomes?
5. Which failures must never be memoized (for example integrity or environment-sensitive failures)?
6. Does the refreshed proof justify a general negative-result reuse packet, or only a narrower path-specific suppression packet?

## Candidate implementation seam
Most likely owner seam if the gate passes:
- `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve.ts`

This remains provisional until owner proof is refreshed post-Packet-E.

Likely shape if opened:
- add one session-local negative memo layer keyed by the same authority-scoped request key discipline already used for positive resolve reuse
- reuse only narrowly proven-safe negative outcomes
- leave integrity/error behavior truthful and retryable where required

## Candidate proof contract
If opened, must prove:
- repeated same-session equivalent negative requests trigger one expensive miss path
- different cwd/world authorities do not collapse together
- negative reuse does not suppress unrelated requests
- retry-sensitive failure classes are not incorrectly cached
- the chosen packet shape is truthful: general negative-result reuse only if multiple proven-safe cases justify it; otherwise keep the fix path-specific and narrow

## Candidate commit messages if opened later
General packet only if proof justifies it:
```text
perf(driver-vite): suppress repeated same-session negative resolve misses
```

Narrower path-specific packet if that is all the proof justifies:
```text
perf(driver-vite): suppress repeated /sw.js negative resolve misses
```

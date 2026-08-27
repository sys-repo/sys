host-native-is-namespace.plan.md
- [x] 471668c7f feat(std): expose host-native identity namespace
- [x] 1568ebbb3 fix(std): define host-native capture trust boundary
- [x] 8e0b3e40c docs(std): align Is predicate docs with runtime behavior
- [x] 73f1eac2c test(testing): prove universal std Is in Chrome
- [x] fda46ae75 refactor(workspace): adopt host-native identity namespace
- [x] a31832c3f refactor(std): remove flat native identity aliases

## Purpose

Give the existing Deno/Node-only `@sys/std/is/server` predicates one coherent public taxonomy, state
their module-evaluation trust boundary precisely, and migrate broad host-identity consumers without
moving owner-specific Promise transport policy into `@sys/std`.

This is not a new package or runtime stratum. The universal browser-safe entrypoint remains
`@sys/std/is`; host-backed classification remains isolated behind `@sys/std/is/server`.

Target shape:

```ts
import { Is } from '@sys/std/is/server';

Is.promise(input); // Existing structural PromiseLike predicate.

Is.Native.proxy(input);
Is.Native.promise(input);
Is.Native.error(input);
Is.Native.uint8Array(input);
Is.Native.sharedArrayBuffer(input);
```

## Adjudicated boundary

### Meaning of `Native`

Within this API, `Native` means that classification uses host-introspection function references
captured from `node:util.types` when the module evaluates rather than userland shape checks or
caller-property reads. It does not mean trusted, owned, immutable, same-realm, constructor-safe, or
safe for arbitrary later operations.

The namespace names the classification mechanism. This makes `proxy` coherent with the other
predicates without the misleading name `nativeProxy`, and it removes repeated adjective chains from
the leaf methods.

| Target                        | Meaning                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| `Is.Native.proxy`             | The captured host classifier recognizes a live or revoked Proxy without invoking traps. |
| `Is.Native.promise`           | The captured host classifier recognizes the Promise brand.                              |
| `Is.Native.error`             | The captured host classifier recognizes a native Error identity.                        |
| `Is.Native.uint8Array`        | The captured host classifier recognizes a Uint8Array identity.                          |
| `Is.Native.sharedArrayBuffer` | The captured host classifier recognizes a SharedArrayBuffer identity.                   |

### Module-evaluation trust boundary

The contract assumes the relevant `node:util.types` classifier bindings still have their
host-provided identities when `@sys/std/is/server` evaluates. The frozen namespace retains those
captured references and must not follow later replacement of properties on the mutable
`node:util.types` object.

This is an initialization precondition, not a claim that `@sys/std` can recover trusted intrinsics
after earlier same-realm code has replaced them. A positive result proves the documented host
classification only within that precondition. Do not describe the predicates as authenticating the
runtime, realm, caller, ownership, or later use of a matched value.

### Exact Promise admission remains owner-local

[Start UI release evidence](../@sys.driver-pi/start-ui-release-evidence.plan.md) deliberately
deferred whether its remaining exact-Promise deferred, admission, observer, and transport-readiness
substrate had a reusable non-Server owner. That extraction is not warranted.

Server and Driver Pi capture their expected Promise constructor and prototype in the same
owner-local evaluation epoch as deferred creation, transport-readiness descriptors, captured
reactions, observation, scheduling, diagnostics, and rejection ownership. A predicate that instead
compares against a prototype captured earlier by `@sys/std` can disagree with an owner-local
classifier after a coherent ambient Promise replacement between those evaluations. The two
classifiers can then admit opposite Promise generations while the owner correctly reports its own
transport ready.

Therefore:

- do not expose `Is.Native.directPromise` or another one-argument exact/base Promise predicate;
- do not replace Server or Driver Pi exact-Promise classifiers with a std-captured prototype check;
- retain exact-Promise admission with each lifecycle owner;
- do not move deferred creation, reactions, observation, scheduling, readiness, diagnostics, or
  rejection ownership into `@sys/std`; and
- require a new explicitly scoped design with an immediate adopting consumer before considering an
  owner-bound expected-prototype primitive.

Local duplication is preferable here because the repeated syntax binds to different owner capture
epochs and therefore does not express one shared semantic authority.

## Compatibility resolution

`@sys/std/is/server` remains behind an explicit server-runtime subpath. The universal `@sys/std/is`
entrypoint does not expose `Native`, import the server module, or load `node:util`.

The flat predicates were introduced by reachable commit `8a93318f8`. Before removal, JSR metadata
reported `@sys/std@0.0.380` as latest, and that published version did not export `./is/server`. No
reachable tag contained the introduction commit, so the evidence established no published consumer
contract for the five flat aliases. This admitted removal rather than a permanent duplicate surface.

`Is.Native` is now the sole broad host-native identity authority on the server entrypoint.

## Implementation shape

Keep runtime and type planes explicit:

- `m.Is/t.ts` owns `Is.Server.Native.Lib` and composes it into `Is.Server.Lib`;
- `m.Is.Server` owns the frozen runtime namespace and explicit host-classifier captures;
- `@sys/std/is/server` continues exporting only the server `Is` value;
- `@sys/std/is` remains unchanged; and
- both `Is` and `Is.Native` remain frozen.

Do not expose the mutable `node:util.types` object or any capture helper through the public API.

## Commit slices

### 1. `feat(std): expose host-native identity namespace`

Landed at `471668c7f` with the frozen namespace, nested type contract, deep-freezing proof,
universal entrypoint isolation, and identity-equal flat compatibility aliases.

### 2. `fix(std): define host-native capture trust boundary`

Landed at `1568ebbb3` with explicit host-classifier capture, an isolated post-import mutation proof,
and a truthful server-entrypoint contract. Complete the corresponding declaration wording in slice 3
alongside the broader predicate documentation audit.

The capture boundary spans these requirements:

- capture the five `node:util.types` classifier functions explicitly at module evaluation;
- use those same references in `Is.Native` and the flat compatibility aliases;
- document the intact-at-capture precondition and resistance to later classifier-property mutation
  on the public server module and type surfaces;
- preserve existing broad classification, no-property-read, no-Proxy-trap, freezing, and alias
  identity behavior;
- prove in an isolated cold runtime that replacing all five properties on `node:util.types` after
  import does not change the frozen namespace or flat aliases;
- restore every mutated descriptor in proof code and keep hostile ambient mutation isolated from
  unrelated tests; and
- make no claim or framework for surviving classifier poisoning before module evaluation.

This follow-up corrects the public contract of the already-landed namespace; it does not reopen or
rewrite landed history.

### 3. `docs(std): align Is predicate docs with runtime behavior`

Audit the public predicate declarations against their implementations before adding the browser
capstone:

- replace vague, misspelled, or overstated `Is.Lib` prose with the actual accepted values and
  structural checks;
- state realm, runtime-marker, prototype, recursion, and parsing boundaries where they affect the
  result;
- document `str` and `num` as aliases rather than independent predicates;
- complete the `Is.Server` and `Is.Native` declaration wording for the landed capture boundary; and
- change documentation only, without changing predicate types or runtime behavior.

### 4. `test(testing): prove universal std Is in Chrome`

Add one real-browser capstone at the existing higher-level browser-proof owner without making
`@sys/std` depend upward on `@sys/testing`:

- keep complete predicate behavior matrices in `@sys/std` unit tests;
- place the capstone under `@sys/testing`, which already depends on std and owns Chrome launch,
  isolated profiles, loopback serving, diagnostics, permissions, and browser CI;
- browser-bundle a fixture that imports the public `@sys/std/is` entrypoint through the workspace
  mapping, then serve and execute that bundle on loopback in Chrome;
- prove `Is.browser()` is true, representative universal predicates execute, and `Native` remains
  absent from the universal value and type surfaces;
- require an explicit browser-to-server success signal so a missing or unexecuted module cannot
  produce a false green from the absence of runtime errors;
- keep the fixture on local bytes with no external network and do not widen `Browser` with generic
  page-evaluation authority; and
- add the proof to `@sys/testing`'s existing `test:browser` and browser-CI lane without placing
  Chrome in either package's default unit suite.

A successful browser-target bundle plus real Chrome execution is the thin cross-runtime capstone; it
must not duplicate every `Is` unit test or attempt to load `@sys/std/is/server` in a browser.

### 5. `refactor(workspace): adopt host-native identity namespace`

Migrate only broad flat consumers of `@sys/std/is/server` and preserve behavior:

- `Is.proxy` → `Is.Native.proxy`;
- `Is.nativePromise` → `Is.Native.promise`;
- `Is.nativeError` → `Is.Native.error`;
- `Is.nativeUint8Array` → `Is.Native.uint8Array`; and
- `Is.nativeSharedArrayBuffer` → `Is.Native.sharedArrayBuffer`.

Known owner groups are:

- `@sys/fs` input and Rooted capability admission;
- `@sys/cli` keyboard error admission;
- `@sys/server` Dist startup, bootstrap status, websocket, and error admission; and
- `@sys/driver-pi` GUI startup identity and Promise transport.

Keep this slice mechanical. Do not replace owner-local multi-condition Promise classifiers, change
Promise capture epochs, or rewrite unrelated domain-specific `Is.proxy` APIs such as Automerge
worker-proxy predicates or immutable-library predicates. Reassess concurrent Server and Driver Pi
work before implementation rather than overlapping an active release-evidence worktree.

### 6. `refactor(std): remove flat native identity aliases`

After all workspace consumers use `Is.Native` and current publication evidence still permits the
cleanup:

- remove `Is.proxy`, `Is.nativePromise`, `Is.nativeError`, `Is.nativeUint8Array`, and
  `Is.nativeSharedArrayBuffer` from `Is.Server.Lib` and the runtime object;
- remove compatibility-only tests and leave canonical namespace tests;
- verify no workspace import relies on the flat surface; and
- leave `Is.Native` as the single broad host-native identity authority.

Publication evidence admitted the removal; no compatibility fallback remains.

## Acceptance criteria

- `@sys/std/is` stays browser-safe and has no `Native` namespace.
- Universal predicate docs describe the implemented structural, realm, and runtime-marker
  boundaries.
- `@sys/std/is/server` exposes one frozen `Is.Native` namespace.
- Public docs state the intact-at-module-evaluation host-classifier precondition.
- Later mutation of `node:util.types` properties cannot redirect frozen namespace methods.
- `Native.promise` remains broad host-brand classification.
- The public universal `@sys/std/is` entrypoint bundles and executes in real Chrome without exposing
  `Native` or loading the server entrypoint.
- No `Is.Native.directPromise` or flat exact/base Promise alias exists.
- Server and Driver Pi retain owner-local exact-Promise capture, admission, readiness, observation,
  diagnostics, and rejection ownership.
- Flat native-identity aliases are absent; `Is.Native` is the sole broad host-native authority.
- Runtime and intermediate namespace objects remain frozen.
- No unrelated package, trusted-intrinsics framework, or Promise transport abstraction is
  introduced.

## Verification

Completed proof:

- focused `@sys/std` server proof passed 8 tests / 14 steps;
- full `@sys/std` check, 192 tests / 2232 steps, and dry publication passed;
- full `@sys/cli` check, 48 tests / 326 steps, denied-authority process proof, and dry publication
  passed;
- final `@sys/fs`, `@sys/server`, and `@sys/driver-pi` dependent checks passed;
- the real-Chrome capstone passed 3 tests / 32 steps;
- all six final attributable paths passed formatting and `git diff --check`; and
- residue searches found no workspace access to a removed flat member.

Repeatable focused std proof:

```sh
cd code/sys/std
deno test -P=test --trace-leaks ./src/m.Is.Server
deno task check
deno task test
deno task dry
```

Run the real-browser capstone at its higher-level proof owner:

```sh
cd code/sys/testing
deno task check
deno task test:browser
deno task dry
```

For the workspace migration, run each affected owner:

```sh
cd code/sys/fs
deno task check
deno task test
deno task dry

cd code/sys/cli
deno task check
deno task test
deno task dry

cd code/sys/server
deno task check
deno task test
deno task dry

cd code/sys.driver/driver-pi
deno task check
deno task test
deno task dry
```

Run `deno fmt --check` with every final attributable path supplied explicitly. Then run the
repository whitespace check from the workspace root:

```sh
git diff --check
```

## Non-goals

- No shared direct, exact, or base native-Promise predicate.
- No owner-independent Promise prototype capture.
- No shared Promise observer, deferred, scheduler, transport, readiness, or substrate-integrity
  framework.
- No attempt to recover trusted intrinsics after pre-evaluation same-realm poisoning.
- No browser implementation of trap-free Proxy or native-brand detection.
- No change to structural `Is.promise` or universal `Is.error`/`Is.uint8Array` semantics.
- No broad cleanup of unrelated `Is` naming.
- No bootstrap-status rejection-drain behavior change.
- No Git mutation, publication, or release action implied by this plan.

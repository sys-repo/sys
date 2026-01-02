## PLAN LOCK — BINDING CONTRACT
--------------------------------------------------------------------------------------

- [x] Snip-refs/ignore all legacy `.Playback` integration surfaces for the harness path
      (runner/runtime/useClock/controller impls).

- [x] Add: `buildPlaybackTimeline(...)` (pure)
  - Input: `{ timeline: Timecode.Experience.Timeline, bundle: SpecTimelineBundle }`
  - Output: `TimecodeState.Playback.Timeline`
    - `beats[]`
    - real `segments[]` (no placeholder `[]`)

- [ ] Add: `createTimelineController(dispatch)` (pure)
  - Input: `(input: TimecodeState.Playback.Input) => void`
  - Output: `TimelineController` (init/play/pause/toggle/seekToBeat)

- [ ] Add: `usePlaybackDriver(...)` (React integration)
  - Owns: `state` via `useReducer(machine.reduce, machine.init)`
  - Owns: Driver lifecycle
  - Wires:
    - Driver observes runtime → `dispatch(input)`
      - `video:time` (from currentTime)
      - `video:ended` (from endedTick)
      - pause-timer inputs (pause materialization)
    - Machine outputs (`cmds`) → Driver applies runtime effects
  - Returns: `{ state, dispatch, controller }`

- [ ] Rewrite `use.Orchestrator.ts` into glue only
  - Build timeline via `buildPlaybackTimeline`
  - Call `usePlaybackDriver({ decks, timeline, startBeat, resolveBeatMedia })`
  - Return `{ controller, snapshot, selectedIndex }`
    - snapshot derives from reducer state (not a runner)

- [ ] Lock: runtime side-effects + runtime observation live only in the Driver
  - Only Driver calls `runtime.deck.*`
  - Only Driver reads `currentTime/endedTick`
  - Machine remains pure

- [ ] Lock: "spec longer than physical media" must not stall playback
  - Treat `video:ended` as authoritative even if spec remains
  - On `video:ended`, machine jumps to next logical spec position:
    - remaining pause window (if any), else next beat, else first beat of next segment, else terminal ended

==========

	•	Gate A (no legacy coupling): the new harness + new orchestrator import only from src/ui/Media.Timecode.Driver/* (and shared primitives), and do not import anything from Media.Timecode.Playback/* or Media.Timecode.Timeline/*.
	•	Gate B (runtime boundary): only the Driver observes currentTime/endedTick and only the Driver calls runtime.deck.*.
	•	Gate C (early-ended robustness): if physical media ends early, we emit video:ended and the machine advances to the next logical spec position (pause remainder → next beat → next segment → terminal), never stalling.
	•	Gate D (closed-loop integration): a deterministic unit test that runs input → reduce → cmds → driver.apply → signals → input and proves early-ended robustness + pause-window progression without React.

==========

Files
/Media.Timecode.Driver/
	•	mod.ts
	•	t.ts (Driver-facing types: Driver contract, Controller type, helper types)
	•	u.buildPlaybackTimeline.ts (pure)
	•	u.createTimelineController.ts (pure)
	•	u.driver.ts (Driver implementation: observe/apply; owns runtime I/O)
	•	use.PlaybackDriver.ts (React integration hook; owns reducer + Driver lifecycle)

---

Somewhere else:
	•	use.Orchestrator.ts

===========


CONFORMANCE PROTOCOL (NON-NEGOTIABLE)
You are bound to the agreed plan. You cannot:

Add, remove, or rephrase any requirement
Introduce concepts not present in the specification
Defer, extend, or "enhance" scope
Rename or relocate responsibilities
Substitute synonyms that shift meaning
Before ANY code, suggestion, or "next step":

Quote the exact requirement(s) you are implementing
Show 1:1 mapping between your output and the quoted text
If no requirement covers your proposal → STOP
If implementation requires plan change:
State PLAN CHANGE REQUIRED then provide:

Remove: (exact text)
Add: (exact text)
Reason: (one sentence)
WAIT for human approval before proceeding
Violations include:

"We could also..." / "It might be nice to..." / "For robustness..."
Adding features, helpers, or layers not specified
Claiming conformance while changing structure
On violation: Human will reply DRIFT. You must immediately revert to last conforming state and re-quote the plan.
--------------------------------------------------------------------------------------

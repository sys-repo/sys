@sys.ui-components
inline-bar-spinner.plan.md
- [x] 02e338d92 fix(ui-components): render Spinners.Bar without a lazy dependency

## Why own the bar?

`Spinners.Bar` is a quiet, indeterminate loading indicator: two staggered marks sweep across a
clipped track. It should be visible while other things load, not depend on another request before
it can draw itself.

Read `react-spinners@0.17.1/BarLoader.js` as a visual reference, not a template. Its motion is
CSS keyframes, not spring physics: each mark's leading and trailing edges travel different
amounts, so its visible length changes as it crosses the clip. The marks use different easing;
within a 2.1 s loop the second starts 1.15 s later. Preserve that two-beat rhythm and changing
silhouette, not the upstream DOM, helper code, or exact timings. At 20 px in the Run button it
should still read as activity; over the video seek slider it should not look like buffered progress.

Before choosing the animation mechanism, read the relevant `@sys/ui-css` implementation and one
component precedent with tests for keyframes and reduced motion. Trace how `css(base, props.style)`
composes caller overrides, how a complete keyframe rule is installed and shared across instances,
and which styles are available on the server versus after client mount. Use that evidence to choose
the simplest idiomatic implementation that puts a mark inside the clip at startup.

Prefer component-scoped CSS keyframes for this repeating sweep. Compare that expression with
`Motion` from the package's common barrel (`motion/react`): use Motion if it expresses the
changing lengths and stagger more clearly while preserving first-render markup and the visible
reduced-motion state. There is no spring to reproduce and no need to build both versions.

## Implementation boundary

- Work in `code/sys.ui/ui-components/src/ui.react/ui/Spinners.Bar/`. Keep `Spinners.Bar`, its leaf
  exports and `BarSpinnerProps` unchanged: `width`, `height`, `transparentTrack`, `theme`, `style`.
- Render the clipped track and marks on the first render, including server rendering. Use local
  `css`, resolve `Color.theme(props.theme)` once, and compose caller styles last. React renders
  the indicator without waiting for an effect or browser-only import. Use one animation mechanism;
  no hand-rolled timer, new dependency, or vendored loader.
- Keep the 80 × 4 default, custom dimensions, rounded clipping, subdued theme foreground and
  two-beat sweep. `transparentTrack` hides only the track. Under `prefers-reduced-motion: reduce`,
  place a stationary mark inside the clip, including on a transparent track; do not freeze an
  offscreen phase. Exact easing is not a public contract.
- Remove the private `u.loader.ts`, `use.Component.tsx` and their glue. Retire the spinner-pin
  rewrite in `code/sys.ui/ui-components/-scripts/task.prep.ts`; check callers of its `prep` task
  before removing the entry point. No obsolete setup should target a deleted loader.

## Acceptance

1. Open `sys.ui.component: Spinners.Bar` in a fresh browser session. With ordinary motion and a
   transparent track, hold playback at startup: a foreground mark is already visible inside the
   clip. Release it and watch two staggered passes change length as they cross. Change width and
   theme; transparency removes only the track. Under reduced motion the mark remains visible and
   stationary.
2. Observe a 20 px Run in `ActionProbe`. In `Player.Video: Controls`, hold played and buffered
   positions fixed and toggle buffering, including under reduced motion. Check that activity is
   distinguishable from those values; report caller occlusion separately. Exercise custom height
   and caller style at the component boundary without adding specimen knobs.
3. Check first-render markup without `window` or waiting for an effect. Run the package's frozen
   type check and existing public leaf-export tests. Keep a focused first-render regression check
   if it distinguishes this implementation from the old `null` result; do not pin DOM structure,
   class names, exact pixels per animation frame, or easing strings. Record browser observations
   separately from these checks.

## Outcome and verification

- `BarSpinner` renders the track and marks synchronously. The private `useSweep` hook uses one
  shared CSS keyframe: each pass clears the clip before the next enters. Motion is opt-in through
  the system preference; the resting pose needs neither playback nor a visible track. Layout
  containment keeps the marks relative to the track when a caller sets `position: static`.
- The frozen package type check and the spinner SSR, root-style, and public leaf-export suites
  passed (3 suites, 16 steps). The SSR test failed on the old empty render. The root-style test
  failed before the containment fix and passed afterward; it checks declarations, not paint.
- Browser evidence: the operator observed the overlap disappear and accepted the final spinner
  after manual inspection. No automated frame capture or per-host pixel comparison is claimed.
- Separate caller finding: at 80% played and 90% buffered, `SeekSlider`'s opaque played fill can
  cover the stationary mark beneath it. This follows from the layer order, not a browser pixel
  comparison. Any change to buffering visibility belongs to the player, not the spinner.

## Outside this change

`@sys/ui-dev` has its own `Harness.Host` spinner importing `react-spinners`. Leave that consumer,
workspace dependency declarations, lockfile, and Vite configuration alone. Removing the dependency
workspace-wide needs a separate consumer audit; do not introduce a shared spinner framework here.
The Sheet/Slider/Spinners.Bar/Splash attachment migration keeps its own scope and landing ledger.

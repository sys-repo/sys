@sys.tmpl
ui-template-maintenance.plan.md
- [x] 1d532c559 fix(std): close signal listener registration on disposal
- [x] 19dc218dd fix(ui-dev): retire specimen attachments before reset publication
- [x] e608035ff fix(ui-dev): close specimen admission during retirement
- [x] fa683998e feat(ui-dev): own specimen attachment lifetimes
- [x] 519b15ea8 fix(tmpl): correct UI scaffold lifecycle ownership
- [x] 41db307d7 feat(ui-react): register stylesheet rules from React
- [x] 917bd0922 fix(tmpl): preserve scoped-style appearance across themes
- [x] 55d4cea12 fix(ui-components): isolate matching scoped styles without changing paint
- [x] 1035f21b7 fix(ui-components): bind Label and Manuscript specimen effects to attachments
- [x] f2a31856b fix(ui-components): bind ActionProbe specimen effects to attachments
- [x] cf117701f fix(ui-components): bind Anchor specimen effects to attachments
- [x] 6d4d9c028 fix(ui-components): bind Bullet and BulletList specimen effects to attachments
- [x] 0f0c14660 fix(ui-components): bind Button family specimen effects to attachments
- [x] bb8f0d129 fix(ui-components): bind Dist and Dist.Browser specimen effects to attachments
- [x] c9b7087de fix(ui-components): bind Chip and Cropmarks specimen effects to attachments
- [x] 15fcd8581 fix(ui-components): bind ErrorBoundary, FadeElement, and Http.Origin specimen effects to attachments
- [x] f7759fb0a fix(ui-components): bind Icon.Swatches, IFrame, and Image.Svg specimen effects to attachments
- [x] 9248652e4 fix(ui-components): bind KeyValue family and Layout.CenterColumn specimen effects to attachments
- [x] 59fae6f31 fix(ui-components): bind RectGrid, SplitPane, Tabs, and TreeHost specimen effects to attachments
- [x] df33406f9 fix(ui-components): bind AudioWaveform and Media.Config specimen effects to attachments
- [x] 7f75f600b fix(ui-components): bind Media.Devices and Media.Recorder specimen effects to attachments
- [x] 78740e2bb fix(ui-components): bind PlaybackDriver and Media.Video specimen effects to attachments
- [x] 13c6bf5de fix(ui-components): bind ObjectView, Ownership, PathView, and video controls specimen effects to attachments
- [x] fa15c1d1f fix(ui-components): bind video deck and element specimen effects to attachments
- [x] 7cfb33b13 fix(ui-components): bind YouTube, Preload, and Prose specimen effects to attachments
- [x] 358cdb877 fix(ui-components): bind Sheet, Slider, Spinners.Bar, and Splash specimen effects to attachments
- [x] c77a41ccb fix(ui-components): bind Text.Ellipsize and Text.Input specimen effects to attachments
- [x] 32af16902 fix(ui-components): bind tree, Vimeo, and Markdown help specimen effects to attachments
- [x] 4c5e626b4 fix(ui-components): bind webfont and CSS specimen effects to attachments
- [x] 6039ece20 fix(ui-components): bind pointer, size observer, and schedule specimen effects to attachments
- [ ] docs(tmpl): inventory UI specimen lifecycle follow-ons across other sys packages
- [ ] fix(ui): bind Files.InfoPanel specimen effects to attachments
- [ ] fix(ui): bind Files.InfoPanel.Config specimen effects to attachments
- [ ] fix(ui-dev): retire the MySample keyboard subscription with its attachment
- [ ] docs(tmpl): inventory UI specimen lifecycle follow-ons across driver packages

## Specimen lifecycle migration inventory

**62 reviewed / 0 remaining** (61 adopted; Icon reviewed no change). Checkboxes record consumer
disposition, not commit landing. UI paths
are relative to `code/sys.ui/ui-components/src/ui.react/ui/`; paths beginning with `ui.react/`,
`m.webfonts/`, or `-sample/` are relative to `code/sys.ui/ui-components/src/`.

- [x] Text.Label — `Text.Label/-spec/`; verified attachment adoption with controls, samples,
      fallback hydration, and traceline preserved.
- [x] Prose.Manuscript — `Prose.Manuscript/-spec/`; verified attachment adoption with Light default
      and fill/grid layout preserved.
- [x] ActionProbe — `ActionProbe/-spec/`; verified attachment-owned automatic effects, retained
      sizing/preferences, and unchanged direct command persistence while detached.
- [x] Anchor — `Anchor/-spec/`; verified attachment adoption with synchronous factory, legacy
      preference projection, explicit size clear, initial traceline, and host footer preserved.
- [x] Bullet — `Bullet/`; verified attachment-owned host effects, retained synchronous ephemeral
      signals, explicit size clear, and no persistence or debug reset API.
- [x] BulletList — `BulletList/-spec/`; verified attachment-owned preference projection, theme,
      reactive width/redraw, retained async factory, and control/persistence behavior.
- [x] Button — `Button/-spec/`; verified attachment adoption with synchronous setup, legacy view
      fallback, reset identity, transient callback normalization, controls, and event forwarding.
- [x] Buttons.Icons — `Buttons.Icons/-spec/`; verified shared preference projection and attached
      theme/redraw with selected icon and click callback preserved.
- [x] Buttons.Switch — `Buttons.Switch/-spec/`; verified synchronous ephemeral attachments, derived
      palette, retained color/value/enabled state, and controlled toggle; no persistence/reset.

- [x] Chip — `Chip/-spec/`; verified shared preference projection and attached host effects,
      retained async setup, overflow controls, legacy hydration, and initial traceline.
- [x] Cropmarks — `Cropmarks/-spec/`; verified shared preference projection and attached host
      effects, synchronous setup, fill/grid layout, and sizing/subject-only controls.

- [x] Dist — `Dist/-spec/`; verified shared sample/projection lifetimes, retained async setup,
      files/view driver behavior, explicit data, and attached host effects.
- [x] Dist.Browser — `Dist/-spec.browser/`; verified shared sample/projection lifetimes,
      unchanged-driver reconnect, and React-owned selection/filter controller.

- [x] ErrorBoundary — `ErrorBoundary/-spec/`; verified shared projection and attached host
      effects, fill margin 150, stable error/reset rendering, and callback forwarding.
- [x] FadeElement — `FadeElement/`; verified synchronous ephemeral attachments, reactive size,
      retained children/duration, and independent React transition lifetime; no persistence/reset.
- [x] Http.Origin — `Http.Origin/-spec/`; verified shared projection and attached host effects,
      async setup, reactive width, controlled branches, and independent retained controller.

- [x] Icon — `Icon/-spec/`; source-reviewed no change: legacy `e.state` renderer and stub Debug;
      no automatic signal consumers or factory to migrate. No runtime-repair claim.
- [x] Icon.Swatches — `Icon.Swatches/-spec/`; verified shared preference projection and attached
      host effects, retained icon initialization/reset, selection/size callbacks, and fill/grid.
- [x] IFrame — `IFrame/`; verified ephemeral attachments, separate host-image dependency, fill/grid,
      transparent subject, existing location/setup callback and renderer props; no persistence/reset.
- [x] Image.Svg — `Image.Svg/`; verified ephemeral attachments, reactive numeric/fill sizing and
      stable Root; static/dynamic assets and mounted controls exercised through the browser harness.

- [x] KeyValue — `KeyValue/-spec/`; shared nested layout projection and attached size/redraw,
      explicit size clear and initial traceline; retained Root and keyboard insertion.
- [x] KeyValue.Switches — `KeyValue.Switches/-spec/`; shared toggle-value projection, retained async
      factory, keyboard/cursor hooks, reorder callbacks, and 360-wide grid.
- [x] Layout.CenterColumn — `Layout.CenterColumn/-spec/`; independent shared column sync and
      preference projection, attached theme/traceline, retained explicit update/reset and fill/grid.

- [x] Layout.RectGrid — `Layout.RectGrid/-spec/`; shared projection, attached host effects,
      mounted selection, and stable Root with inherited fill margin.
- [x] Layout.SplitPane — `Layout.SplitPane/-spec/`; shared ratio projection and attached host
      effects; retained React-owned ratio handling and fill margin 100.
- [x] Layout.Tabs — `Layout.Tabs/-spec/`; shared selection projection and attached host effects;
      retained async setup, controlled selection, and fill margin 100.
- [x] Layout.TreeHost — `Layout.TreeHost/-spec/`; independent shared path observer and preference
      projection, nested slot redraw, and fill margin 80 without subject theme paint.

- [x] Media.AudioWaveform — `Media.AudioWaveform/-spec/`; shared theme/debug projection and
      per-host effects; retained transient stream, reset, and fill-x/grid.
- [x] Media.Config.Filters — `Media.Config/-spec.filters/`; attached host effects; retained direct
      debounced storage, including pending-event flush on React cleanup.
- [x] Media.Config.Slider — `Media.Config/-spec.slider/`; attached host effects, retained value
      interaction without persistence.
- [x] Media.Config.Zoom — `Media.Config/-spec.zoom/`; attached host effects; retained direct
      debounced storage, including pending-event flush on React cleanup.

- [x] Media.Devices — `Media.Devices/-spec/`; shared preferences and per-host paint, redraw,
      and 240/400 sizing; retained independent device selection, persistence, and reset.
- [x] Media.Recorder — `Media.Recorder/-spec/`; attached host effects and retained aspect-ratio
      sizing; direct delayed writes, recorder/device hooks, and stream remain independent.

- [x] Media.Timecode.PlaybackDriver — `Media.Timecode.PlaybackDriver/-spec/`; shared preferences
      and attached paint/redraw; saved document startup, controller and deck ownership unchanged.
- [x] Media.Video — `Media.Video/-spec/`; shared theme/debug and attached paint, sizing, and
      redraw; delayed Config writes and React device selection remain independent.

- [x] ObjectView — `ObjectView/`; ephemeral attachments; retained optional factory initializer,
      explicit size clear, and expansion/show controls.
- [x] Ownership — `Ownership/-spec/`; shared theme/debug, async factory, and 360-wide grid retained.
- [x] PathView — `PathView/-spec/`; shared preferences, explicit size clear, and optional segment clicks.
- [x] Player.Video.Controls — `Player.Video.Controls/-spec/`; shared nested preferences and separate
      width/paint/redraw; video signals, reset, and controls retained.

- [x] Player.Video.Decks — `Player.Video.Decks/-spec/`; separate shared preferences and URL sync,
      stable deck signals, host paint and redraw tied to attachment.
- [x] Player.Video.Element — `Player.Video.Element/-spec/`; separate shared preferences and
      controlled-input sync, stable player signals, and React-owned runtime work retained.

- [x] Player.YouTube — `Player.YouTube/-spec/`; shared preferences, explicit size clear, and
      theme/redraw ownership; iframe source and existing controls retained.
- [x] Preload — `Preload/`; attached redraw and one-time layout, no renderer or persistence;
      the explicitly launched portal keeps its own lifetime.
- [x] Prose.Markdown — `Prose.Markdown/-spec/`; shared theme/debug/sample preferences; viewport
      sizing is independent of redraw, and the sample renderers and transient content are retained.
- [x] Prose.Measure — `Prose.Measure/-spec/`; shared theme/debug, async factory, and fill/grid retained.

- [x] Sheet — `Sheet/-spec/`; ephemeral paint/redraw and 390 × 844 grid; debug toggle and
      React animation preserved. The inherited mouse handlers write to a snapshot, not the signal.
- [x] Slider — `Slider/-spec/`; ephemeral 350-wide grid, host-only paint, and existing pointer
      feedback and configuration controls retained.
- [x] Spinners.Bar — `Spinners.Bar/`; ephemeral fill/grid with default margin, stable renderer,
      and independent React loader.
- [x] Splash — `Splash/-spec/`; shared existing preferences and attached fill/grid, paint, and
      redraw; async setup, package/query options, and React keyboard lifetime retained.

- [x] Text.Ellipsize — `Text.Ellipsize/-spec/`; shared preferences, width-only sizing, and no
      harness theme paint; async factory and React text measurement retained.
- [x] Text.Input — `Text.Input/-spec/`; shared existing preferences, theme-only host paint,
      fill-x/grid with margin 150, transient decorations, and stable input renderer.

- [x] TreeView.Index — `TreeView.Index/-spec/`; shared preferences and separate path observer,
      retained YAML-derived tree and fill-y/grid with margin 150.
- [x] TreeView.Index.Item — `TreeView.Index.Item/-spec/`; shared existing preferences, retained
      padding preset, and explicit size clear.
- [x] VimeoBackground — `VimeoBackground/`; ephemeral effects and default fill margin; React
      still hands the player API to the existing ready callback.
- [x] Dev.Help.Markdown — `ui.react/dev/m.Help.Markdown/-spec/`; shared sample preferences,
      retained async setup, centered 440-wide grid, and initial-only traceline.

- [x] WebFonts — `m.webfonts/-spec/`; shared preferences, retained 640-wide grid and separate
      Root with React-owned font registration.
- [x] CSS.Container — `-sample/-css-container/`; ephemeral theme paint and redraw; retained
      fill/grid, optional initializer, and mounted size observer.
- [x] CSS.Scroll — `-sample/-css-Scroll/-spec/`; shared preferences including false `Scroll`;
      retained async setup and fill-y/grid.
- [x] React.useWebFont — `-sample/-css-useWebFont/`; shared debug/theme, explicit size clear,
      grid, and React-owned font registration.

- [x] React.usePointer — `-sample/-dom-usePointer/`; ephemeral redraw and initial subject paint;
      explicit size clear and independent React subject/footer samples retained.
- [x] React.useSizeObserver — `-sample/-dom-useSizeObserver/`; ephemeral rect redraw;
      fill/grid and React-owned observer retained.
- [x] Std.Schedule — `-sample/-std-Schedule/`; shared theme projection and host-local paint/redraw;
      400-wide grid, one-time factory startup, and explicit run/reset retained.

An unchecked entry awaits assessment or migration; check it only for verified adoption or a
justified, source-reviewed no-change outcome. Deferred work remains unchecked with its reason. Flags
are inspection notes, not approved policy changes; absence of a flag does not establish behavioral
equivalence. The 16 ui-components migration units beginning with Chip/Cropmarks map in order to the
16 accepted inventory groups, covering their original 51 entries exactly once. Inventory dispositions
advance independently of arc landing. Icon belongs to the third group's source-reviewed no-change
disposition; its commit subject names only the specimens needing migration. Inventory boundaries
are single blank lines; earlier checked historical blocks are not part of those 16 groups. These
are proposed landing units, not bulk-migration authority. Follow the re-entry boundary and workbook
before implementation.

Inventory provenance: the shallow scan at `ce341a391` found **62 specimen/debug pairs**: 54 UI
specimens, one development helper, one webfont specimen, and six samples. All were registered by
`src/-test/-specs.ts`; filename discovery and the package-wide `Spec.describe` search agreed. Each
entrypoint was opened; debug factories were inspected selectively. At that baseline, the package
source search had no `Spec.attachments` matches. This establishes extent, not a complete ownership
audit; recheck after source changes. Each listed directory contains `-SPEC.tsx` and
`-SPEC.Debug.tsx`. Registry label `SpecsExternal` does not put package-owned call-sites outside
scope.

## Re-entry boundary

The opening arc is the sole landing ledger. Each remaining group requires bounded human selection
and explicit implementation authorization. Readiness does not authorize implementation.

### Sheet, Slider, Spinners.Bar, and Splash unit

Scope: the four specimen/debug pairs only. Sheet, Slider, and Spinners.Bar have no persistence;
Splash shares its existing five stored fields. Preserve host sizing, theme rules, and controls, and
leave animations, pointer handling, dynamic loading and keyboard listeners with React. Sheet's
mouse handlers mutate a snapshot; that existing issue is separate from attachment adoption.
The [group proof](./ui-template-maintenance.plan/evidence.md#sheet-slider-spinnersbar-and-splash-attachment-proof)
records mounted behavior, restored controls, and retained verification. The opening arc records
landing separately.

### YouTube, Preload, and Prose unit

Scope: the four specimen/debug pairs only. YouTube preserves its explicit size clear and iframe
source control. Preload keeps layout without a renderer, has no stored preferences, and launches
portals only from the existing button. Markdown keeps viewport-driven sizing and sample renderers;
only theme, debug, and sample selection persist. Measure keeps its async setup and fill/grid.
The [group proof](./ui-template-maintenance.plan/evidence.md#youtube-preload-and-prose-attachment-proof)
records the mounted paths, negative controls, and retained checks. Adoption is not landing.

### ObjectView, Ownership, PathView, and video controls unit

Scope: the four specimen/debug pairs only. Keep ObjectView ephemeral; Ownership and PathView share
existing preferences. Video controls share their existing layout and nested background preferences,
not playback state. Keep width independent of video-driven redraw; preserve explicit size clears,
Ownership's centered 360-wide grid, and each subject's paint policy. See the
[group proof](./ui-template-maintenance.plan/evidence.md#objectview-ownership-pathview-and-video-controls-attachment-proof).

### PlaybackDriver and Media.Video unit

Scope: the two specimen/debug pairs in `Media.Timecode.PlaybackDriver/-spec/` and `Media.Video/-spec/`.
Bind automatic preference projection and per-host paint/redraw while keeping PlaybackDriver's
one-time saved document load, deck references, and mounted controller outside attachments. Preserve
Video's explicit size clear, aspect-ratio sizing, and React-owned device selection, stream, and
Config callbacks. See the [group proof](./ui-template-maintenance.plan/evidence.md#playbackdriver-and-mediavideo-attachment-proof)
for checks and runtime limits.

### Media.Devices and Media.Recorder unit

Scope: `Media.Devices/-spec/` and `Media.Recorder/-spec/`, limited to their specimen/debug pairs.
Attach theme paint, sizing, and tracked redraw separately. Devices shares only its existing
preference fields; React retains selection restore and persistence under its own key. Recorder has
no shared projection: keep applied filter/zoom updated by the existing delayed callbacks, and leave
recording, selection, and capture hooks with their React owners. Preserve the stable roots, sizing
branches, and Recorder's light subject paint.

The [group proof](./ui-template-maintenance.plan/evidence.md#mediadevices-and-mediarecorder-attachment-proof)
records the mounted control paths, restored controls, limits, and retained checks. The opening arc
remains the landing ledger.

### AudioWaveform and Media.Config unit

Scope: `Media.AudioWaveform/-spec/` and `Media.Config/-spec.filters/`, `-spec.slider/`, and
`-spec.zoom/`, each limited to its specimen/debug pair. All four bind host paint and tracked redraw
separately. Waveform shares only theme/debug projection across live hosts; its stream and React
media hooks stay independent. Filters and Zoom retain hydration, immediate `onChange` updates, and
React-owned debounced `onChanged` writes, including pending-event flush on cleanup. Slider remains
storage-free. Keep the existing sizing, grid, and theme behavior.

The [group proof](./ui-template-maintenance.plan/evidence.md#audiowaveform-and-mediaconfig-attachment-proof)
records the baseline, registered-suite journeys, restored controls, and retained checks. The opening
arc records the verified eight-file landing.

### RectGrid, SplitPane, Tabs, and TreeHost unit

Scope: the four specimen/debug pairs. Preserve field-wise preference storage, signal references,
reset commands, and setup signatures. Bind theme paint and tracked redraw independently. RectGrid
keeps the inherited fill margin, selection, and existing prop omissions. SplitPane and Tabs keep
fill margin 100; SplitPane keeps React-owned ratio handling, and Tabs keeps its promise-returning
factory and controlled selection. TreeHost keeps fill margin 80 and does not repaint the subject
background. Its tree/path observer is shared across live hosts but separate from persistence;
transient tree and nested slots remain outside storage.

The [group proof](./ui-template-maintenance.plan/evidence.md#rectgrid-splitpane-tabs-and-treehost-attachment-proof)
records the registered-suite probes, restored controls, retention decisions, and final checks. The
[blind review](./ui-template-maintenance.plan/evidence.md#layout-quartet-review-adjudication)
found no blocker in the final eight files, including RectGrid's `makeItem` refactor. Accept unchanged;
pre-existing test narrowing is separate. The opening arc records the verified eight-file landing.

### KeyValue family and Layout.CenterColumn unit

Scope: the three specimen/debug pairs. Preserve KeyValue's synchronous setup, nested field-wise
projection, transient items/cursor model, layout getter, explicit size clear and subsequent width 320,
initial traceline, and React-owned keyboard/reorder work. Switches retains promise-returning setup,
merged saved values, sample/reorder callbacks, 360-wide grid, and React-owned cursor/toggle behavior.
CenterColumn retains synchronous construction with columns available immediately and explicit
`update`/`reset`. Automatic column sync observes theme/alignment only, independently of preference
projection; unchanged reconnects retain columns while changed inputs catch up on attach. Its
fill/grid and theme-derived traceline stay separate from broad redraw.

The [group proof](./ui-template-maintenance.plan/evidence.md#keyvalue-family-and-layoutcentercolumn-attachment-proof)
records temporary actual-suite and mounted-subject journeys, restored controls, retention decisions,
and retained-tree checks. The supplied blind review found no behavioral blocker; accept the six-file
migration unchanged. No permanent tests or helpers added. Existing example-shape and incidental
assertions are not earned coverage; the [test-only follow-up dispositions](./ui-template-maintenance.plan/evidence.md#keyvalue-family-and-centercolumn-review-adjudication)
are separate from this migration and require their own authorization.

### Icon.Swatches, IFrame, and Image.Svg unit

Scope: the three specimen/debug pairs and Image.Svg's affected `-.test.ts`. Icon remains unchanged:
its legacy renderer and stub Debug have no automatic consumers for attachment migration. Preserve all
three synchronous factories, signal/store references, controls and existing rendering contracts.
Icon.Swatches retains one-time icon walking, reset/repopulation, field-wise preferences and both
selection/size callbacks. IFrame remains ephemeral with a separate host-image effect and one-time
transparent subject paint; preserve module-level location, optional factory-init callback, current
renderer forwarding and omitted knobs rather than adding features. Image.Svg remains ephemeral with
numeric/fill sizing and independent React-owned SVG imports/drawing effects. Do not redesign the SVG
hook or samples. Keep theme-only paint separate from redraw and other dependencies.

The [group proof](./ui-template-maintenance.plan/evidence.md#iconswatches-iframe-and-imagesvg-attachment-proof)
records actual-suite journeys, the mounted asset-aware browser proof, restored controls, retention
choices and final checks. Temporary probes/helpers were removed; the assertion-free SVG import test
was removed without replacing it with a permanent lifecycle matrix. The supplied independent blind
review found no material correctness or retention issues; adjudication accepted the unchanged delta.
Its source/check replication did not independently rerun mounted-consumer or asset-aware browser
journeys. No further review or source correction is warranted by the current findings.

### ErrorBoundary, FadeElement, and Http.Origin unit

Scope: the three specimen/debug pairs. Preserve setup signatures, signals/store references, field-wise
preferences, controls, and independent React/controller lifetimes. ErrorBoundary retains fill/grid
with margin 150 and error/reset forwarding. FadeElement remains ephemeral without persistence/reset;
its fixed-size versus cleared-size update remains reactive. Http.Origin retains its factory controller,
controlled/uncontrolled branches, width, sample selection, and verification controls. Do not dispose or
recreate its controller on detach. All three keep theme paint separate from broad redraw.

The [trio proof](./ui-template-maintenance.plan/evidence.md#errorboundary-fadeelement-and-httporigin-attachment-proof)
records temporary actual-suite journeys, restored controls, retention decisions, and final checks.
No new permanent tests or fixture helpers are required.

### Chip and Cropmarks unit

Scope: the two `-spec/` pairs and Chip's affected `-test/-spec.controls.test.tsx`. Preserve Chip's
promise-returning setup and Cropmarks' synchronous setup, retained signals/store references,
field-wise preferences and unrelated fields, reset, controls, and renderers. Chip leaves subject
size omitted and applies initial traceline 0.03 after theme setup; Cropmarks retains fill/grid with
inherited fill margin. Both retain subject-Light paint argument 1. Shared projection and host
theme/redraw have distinct lifetimes and dependencies; no component, sample, or owner redesign.

The [pair proof](./ui-template-maintenance.plan/evidence.md#chip-and-cropmarks-attachment-proof)
records temporary actual-suite journeys, restored controls, final retained-tree checks, and the
assertion-level reduction of existing Chip coverage. No new permanent lifecycle matrix is required.

### Dist and Dist.Browser unit

Scope: `Dist/-spec/` and `Dist/-spec.browser/`, plus affected consumer tests under `Dist/-test/`.
Bind automatic preference projection and sample synchronization to the factory's live attachment
lifetime; bind host theme and tracked redraw separately. Preserve async factory/suite setup,
signal/store identity, reset, explicit sample/undefined controls, and the existing `updateDist`
member. Both factories use the same storage key: retain field-wise projection and preserve fields
owned only by the other specimen, including `debugView`, and unrelated stored fields.

Sample synchronization is not ordinary persistence. Preserve the initial sample normalization before
the async factory resolves, without starting a permanent factory effect or automatic storage
projection. Preserve its actual driver dependencies: sample-files mode in both factories, plus
`debugView` in Dist even though that value is not passed to the sample builder. A direct `dist`
assignment, theme/debug change, extra host, or unchanged-driver reconnect must not regenerate the
sample. Reconnect retains current data when drivers are unchanged and reconciles changed drivers
without rehydrating storage; detached automatic projection/synchronization must be inert. Later
explicit selection commands acknowledge current drivers and win over earlier detached driver
changes; reset shares that bookkeeping. Subsequent driver changes must still regenerate samples.
Keep sample synchronization dependencies distinct from persistence reads so projection cannot create
a self-overwriting loop. Use bounded local state as needed, not a new owner API or framework.

Use suite-local `Root()` and `render: () => <Root />` in both suites. Preserve Dist's `[360, null]`
and Browser's `[360, 300]` sizes, grid, subject-Light alpha 1, debug-panel previews, controls, and
callbacks. Browser's `Dist.useBrowserController` remains React-owned inside its stable Root, with
selection/filter forwarding and bottom toolbar unchanged. Do not change component/controller code,
synthetic sample data or trust semantics, storage keys, dependencies, public APIs, or sibling
consumers. Remove duplicate imperative redraw setup rather than retaining two initial paths.

Use small temporary actual-suite probes colocated in `Dist/-test/`, with isolated storage and
existing host mechanics. Cover attachment replacement/retirement/reconnect, detached inertness,
retained explicit data, driver-triggered sample replacement, shared-key field preservation, and
mounted Browser selection/filter behavior. Exercise useful restored controls, especially missing
projection and unintended sample replacement; do not copy a full lifecycle matrix. Keep lasting
behavior regressions only when earned under rule 4; remove temporary probes/exclusive helpers and
record proof in the same pass. Retain the existing sample-observation contract: display fixtures are
not trusted artifact evidence. Revalidate retained `Dist/-test/` tests, package check, scoped
formatting/lint, and diff checks; disclose inherited diagnostics without suppressions. The
[Dist pair proof](./ui-template-maintenance.plan/evidence.md#dist-and-distbrowser-attachment-proof)
records executed temporary journeys, restored controls, the narrow retained sample contract, and
verification limits.

### Button family unit

Scope: the three selected `-spec/` pairs and their affected consumer tests. Bind automatic
preference projection for Button and Icons to shared attachments; Switch stays ephemeral with no
persistence or invented reset. Bind host theme and tracked redraw separately, preserving each
existing theme alpha, explicit size clear, grid layout, synchronous setup, controls, renderers, and
event callbacks. Preserve Button's legacy view fallback, signal identity on reset, false/zero
values, and transient callback-valued enabled/opacity normalization. Preserve Icons' selected icon
and Switch's independent theme name, color selection, derived palette, and toggle behavior. Apply
workbook callback syntax only within the selected work; no component redesign, public API,
dependency, or older-template edits.

Adapt Button's persistence-dependent reset/view tests to real attachments and isolated storage;
review retention under workbook rule 4 rather than preserving cosmetic assertions by default. Use
temporary actual-suite probes for replacement, retirement, disposal, reconnect, retained state, and
detached projection/redraw/theme inertness. Exercise useful restored negative controls; record proof
and limits, remove probes/exclusive helpers, then rerun retained Button/Switch consumer tests,
package check, scoped formatting/lint, and diff checks in the same pass. New permanent lifecycle
matrices are not the default.
[Button family proof](./ui-template-maintenance.plan/evidence.md#button-family-attachment-proof)
records the temporary actual-suite journeys, restored controls, retention decisions, and final
checks.

Historical scope mapping: the proposed
`refactor(ui-components): use method syntax for Bullet specimen renderer` is included in `6d4d9c028`
with the pair's migration. Its `render()` method was verified in that commit; no separate renderer
follow-up remains. The earlier observed `591948541` identity is superseded. That callback-form pass
granted no permission to change templates, ActionProbe, or retained tests.

On return, reopen this boundary and workbook, inspect Git/source freshness, and select the next
bounded unit with the human before implementation. Do not interpret a planned arc item as
approval for a batch. Historical proof is not a substitute for that unit's own verification.

Use the workbook below for future authorized units. Historical consumer receipts preserve contracts
and proof limits; they do not establish permanent assertion exemptions or current callback style. A
migration may confirm the workbook without changing it. No new framework or gate is required.

## Migration workbook

1. Inspect each specimen/debug pair and its helpers. Classify automatic/reactive effects, explicit
   commands, and independently owned React/async work; shared ancestry proves none of their
   ownership policies. Identify existing behavior assertions before changing wiring.
2. Bind automatic specimen preference projection to the shared attachment generation and host
   effects to one attachment per init. Preserve explicit command semantics and independent owners by
   default; direct writes alone do not require a new policy decision. Escalate when a behavior
   change or unresolved ownership is actually required. Retain signals/store refs across
   disconnection rather than rehydrating on reconnect. Match the UI template's factory shape:
   declare `const { attach } = Spec.attachments({ shared() { ... } });` after `props`/`p`, keep
   `listen`/`reset` as local functions, then `return { props, listen, reset, attach }` (plus any
   consumer-owned members). Do not inline the owner inside the returned API or end it with
   `}).attach`. Keep existing legacy-field normalization/deletion inside the shared projection;
   attachment migration does not authorize removing storage compatibility. For ephemeral factories,
   use `const { attach } = Spec.attachments()` with no invented shared callback, persistence, or
   reset API; return only their existing members plus `attach`.
3. Preserve consumer additions, not template defaults. Omitted size leaves inherited size alone; an
   existing explicit size clear must remain explicit. Omitted fill margin retains the harness
   default. Keep theme and redraw separate, and initial-only paint overrides independent of later
   reactive theme updates. Do not copy owner machinery.
4. **Prove broadly during migration; retain narrowly by exception.** Ordinary specimen migrations
   default to no new permanent per-specimen test. Temporary actual-suite probes establish ownership,
   retirement, reconnect, and behavior preservation; their usefulness during refactoring does not
   establish lasting value. For every retained test family, name the consequential behavior failure,
   its user or developer-tool impact, and why existing owner/consumer tests do not protect it. A
   demonstrated fault is sensitivity evidence, not automatic retention authority. Protect real
   runtime regressions at the narrowest responsible owner; do not create an abstraction merely to
   make specimen probes look reusable.

   **Apply the harmless-change test:** would changing examples, default appearance, layout, or
   incidental configuration break the test without breaking the named behavior? If so, remove or
   refocus the assertion; do not maintain specimen and test in lockstep. Removing a specimen feature
   may legitimately remove its dedicated regression test—never preserve sample code for the test.
   Specimen shape, exact reset samples, renderer/data identities, and configuration catalogues are
   migration evidence by default, unless independently required by an observable contract. Signal
   identity and sample-object identity are not interchangeable obligations.

   Storage seeds are inputs, not shape assertions, but must establish only the relevant scenario
   plus necessary isolation, not mirror the specimen schema. Use a concrete starting value when a
   transition needs it; do not freeze today's defaults or export/import them just to synchronize an
   oracle. Testing when data is replaced differs from revalidating its sample contents. Do not test
   the test's assertions, scaffolding, or chosen examples as a permanent substitute for behavior.
   Delete unearned coverage before extracting mechanics. Shorter code, helpers, green runs, review
   approval, and the label "regression" do not earn retention. Review pre-existing assertions too.
5. Fixtures own storage isolation, suite loading, controller setup/cleanup, and stable observations.
   Keep meaningful mutations and semantic assertions visible in the test. Use real imported suites;
   never reconstruct the attachment wiring in the fixture. Capture write attempts before
   deduplication and copy mutable observation data rather than retaining live context aliases.
   Expose earned helpers through the narrowest existing test-only barrel owning their domain, not
   production or an unrelated broader toolkit. Keep dependencies one-way: fixture implementations
   must not import the barrel exporting them. Update existing callers together; do not add aliases
   or a new namespace merely to shorten paths. Choose the smallest truthful fixture: non-persistent
   specimens use host-only setup, not an invented storage key or a growing option catalogue.
6. **Completion includes a separate retention-and-residue pass.** After implementation and proof,
   and again after the last review correction, stop adding coverage and reassess every touched test
   under rule 4. Pruning line count is not this assessment. Review each assertion's failure meaning,
   not merely whether the file was labelled temporary; also inspect seeds, variants, identity
   checks, and helpers for incidental coupling. Keep lifecycle-mechanism coverage at its owner.

   Restore bounded negative controls, record executed proof and limits, and delete migration-only
   probes, unearned assertions, and exclusively used setup before declaring completion. Preserve the
   smallest justified behavioral regressions, then rerun retained affected tests and checks against
   the final tree. Do not count a failure of equivalent object identity as data loss, or a manually
   invoked factory sequence as proof of a reachable UI interaction. Report briefly what was removed,
   what remains, why it matters, and any verification limits. An unresolved retention decision must
   be disclosed, not silently promoted into permanent coverage. Any commissioned review must use the
   mandatory migration-review brief below; a correctness-only verdict does not settle retention.

   Do not wait for the human to request cleanup after handoff. Owner tests do not prove consumer
   wiring: retiring a probe deliberately trades ongoing per-consumer wiring coverage for recorded
   migration-time evidence. No universal lifecycle matrix, specimen-shape mirror, or
   exception-option catalogue. Record only verified inventory dispositions.
7. Preserve each factory's existing setup contract: synchronous stays synchronous; promise-returning
   stays promise-returning even when its current body is synchronous. Awaited prerequisites and
   attachment-owned reactive work are different contracts; effects are not a substitute for setup
   readiness. Do not propagate per-factory `require-await` suppressions, dummy awaits, promise
   wrappers, or compatibility helpers merely to satisfy lint. Compare diagnostics with the existing
   code and distinguish inherited findings from introduced regressions. Broader lint-policy changes
   are separate work, not an implicit prerequisite for lifecycle migration. Keep effect callbacks
   synchronous and inspect called APIs' return contracts.
8. **Callback form: one-line expression, otherwise a block; named object callbacks use methods.**
   - If the entire single-expression arrow fits on one formatted line, keep it on one line without a
     block: `render: () => <Root />` or `() => void ctx.subject.size([p.width.value, null])`.
   - **NEVER use multiline expression-bodied arrows**, including `() => (` JSX renderers.
   - **Multiline named object callbacks MUST use method syntax:** `render() { return (...); }`, with
     the method and JSX formatted normally. Do not use `render: () => { ... }` instead.
   - Anonymous callbacks, such as entries in `effects` or test handlers, still use arrows. When
     multiline or multi-statement, use a block and explicit `return` if a value is required.
   - Use `void` only when an expression body's value must be discarded. Inside a block, write
     `debug.listen();` then `ctx.redraw();`, without redundant `void`. Neither form handles promise
     rejection. Preserve lexical `this`/`arguments` semantics; if method conversion would change
     them, stop and resolve the contract rather than silently changing behavior.
   - Inspect the formatted diff before handoff. The authored UI templates and older consumers are
     ownership examples, not blanket callback-form exemplars. In particular, the two templates'
     block-bodied `void ctx.redraw()` and ActionProbe's corresponding redraw and multiline `actOn`
     arrow predate this rule and MUST NOT be copied. Corrections to those sources require separate
     authorization; this rule governs new work without silently expanding its scope.

### Mandatory migration-review brief (TMIND)

When commissioning a review of a unit in this workbook, the prompt **must explicitly include the
retention examination and output below**. Merely saying "S-tier", "minimal", or "review the tests"
is insufficient. This specifies review content, not an automatic extra review round. Canonical
blind-review calibration, prompt format, independence, authority, and mutation boundaries still
apply; do not supply prior verdicts or tell the reviewer which tests it should approve or delete.

**How to write the brief:** identify the exact arc item, attributable source changes, and all newly
retained or modified tests, including untracked files and relevant fixture dependencies. Include
review-correction additions, not only the original migration diff. Require TMIND from both a
correctness skeptic and a future-maintainer viewpoint. Ask the reviewer to distinguish component
behavior, consequential developer-tool behavior, and temporary specimen-migration observations;
current implementation and plan prose do not establish a durable contract by themselves.

**What the reviewer must examine:**

- For each retained test family, what consequential failure does it detect, who experiences it, and
  why is the responsible owner not already adequately tested? Establish an actual use path or an
  independently required command contract. A synthetic factory sequence alone does not prove UI
  reachability; missing evidence is a limit, not proof that the behavior is valuable or useless.
- Make the strongest case for **deleting the test entirely** after migration. What distinct
  protection would be lost? Inspect every assertion and its setup, including storage seeds, variant
  loops, reset expectations, sample equality, and reference identity. Distinguish a bad user result
  from an equivalent reconstruction or changed example. Fault detection alone does not justify the
  ongoing maintenance cost.
- Apply rule 4's harmless-change test. Find assertions that force specimen/test lockstep, duplicate
  owner coverage, or revalidate test scaffolding rather than behavior. Do not reject concrete inputs
  merely for being literals; identify their causal role. Do not preserve shape checks by importing
  defaults, moving them into a helper, or extracting a new production abstraction.
- Check the counter-risk: would proposed deletion lose a genuine behavior regression? Keep the
  smallest meaningful protection at its existing owner. No deletion quota, line-count target,
  mandatory per-specimen matrix, or demand for new tests simply because coverage can be imagined.

**What the review must return:** give an overall verdict and separate conclusions on behavioral
correctness and permanent-test retention. Include a compact **keep / narrow / remove** disposition
for each retained test family, with its concrete behavior justification or incidental coupling. For
a material finding, name the exact path/assertion or symbol, failure or harmless-change sequence,
impact, smallest coherent correction/deletion, and closing verification. Separate executed evidence,
source-derived scenarios, and historical receipts. A clean result is valid, but "tests pass" or
"regression coverage is valuable" is not a retention assessment. Complete both examinations even
when a correctness blocker is found; disclose any examination not completed.

**After review:** adjudicate both correctness and retention findings within current authorization.
New regression assertions added to close findings are not exempt from rules 4 and 6. After the last
correction, perform the retention/residue pass and final retained-tree verification before handoff.
Do not repeatedly commission broad reviews or preserve new test residue merely because it was added
in response to review. Carry unresolved retention decisions explicitly; do not call cleanup
complete.

When the review result is pasted back, adjudicate it against the current candidate and distinguish
blockers from separate follow-ups. End the response with one line: **GO** and why the reviewed
unit can land, or **NO-GO** and what must change or be verified first. This is a recommendation,
not authorization to stage or commit.

## Purpose and boundaries

Repair specimen lifecycle ownership and scoped-style interference independently, then migrate only
behaviorally equivalent consumers. Preserve Text.Label's subsequent behavior; do not restore its old
scaffold or intentionally removed unused stylesheet.

Repository: `/Users/phil/code/org.sys/sys`. The opening arc records landing, not blanket acceptance.
[Evidence and recovery](./ui-template-maintenance.plan/evidence.md) records bounded proof, accepted
limits, and source provenance. Planning, readiness, and review grant no implementation or
Git-mutation authority.

Owners stay separate:

- `@sys/std`: signal listener registration and closure.
- `@sys/ui-dev`: admission, retirement, and `Spec.attachments` composition.
- Debug factories: signal identity, defaults, storage projection, and persistence policy.
- `@sys/ui-react`: React timing adapter; `@sys/ui-css`: serialization, pooled sheets, and
  deduplication.
- `@sys/ui-components`: inventoried consumer adaptations, not a workspace-wide mechanical migration.

[template-dependency-parity.plan.md](./template-dependency-parity.plan.md) owns dependency
projections. Coordinate bundle writers, but do not mix dependency refreshes, controller redesign,
storage durability, global CSS/JSON engine changes, or visual standardization into this arc.

## Lifecycle contract

Authority: `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.Spec/`, especially `t.ts`,
`u.attachments.ts`, and `-u.attachments.test.ts`. Use that owner rather than copying its machinery.

- `Spec.attachments({ shared? })` creates an inert factory-local owner. `attach(ctx, args)` returns
  a lifecycle and replaces only this owner's attachment to that context. Other contexts/factories
  stay independent. Closed admission acquires nothing and preserves an incumbent.
- The harness owns admission checks, retirement, shared-effect generations, reentrancy, and setup
  cleanup. Retirement precedes reset publication; successful load replacement retires the old
  specimen, while failed imports and normal completion retain it. Running callbacks are not
  cancelled, and completed writes are not rolled back.
- First attachment starts one shared effect; last detach releases it. Signals and the shared store
  reference survive detach. Debug factories supply storage projection, not registries or bus wiring.
- Each specimen uses one `debug.attach(ctx, { subject, effects })`. Keep theme synchronization and
  redraw separate: theme reads only `p.theme.value` and calls `Harness.Theme.background`; redraw
  calls `debug.listen()` and `ctx.redraw()`. Unrelated knobs must not overwrite custom host paint.
- Preserve subject sizing, margins, layout, renderer contracts, controls, callbacks, signal
  identity, storage keys/defaults, and controlled/uncontrolled branches. General types belong in
  shared barrels, not specimen-local `-t.ts` files.
- Persistence is attachment-scoped and best effort: hydrate once at creation, project retained
  values on first attach, avoid duplicate projection for additional hosts, and keep disconnected
  changes in memory until reconnect. Retained values win for specimen fields; reset preserves signal
  objects. Failed serialization may leave the cache ahead of bytes; unchanged reconnect guarantees
  neither retry nor durability.

### Lifecycle artifact evidence

`519b15ea8` retained an older bundle; `84dc7dd7b` later refreshed the six specimen/debug/type
entries and two dependency entries. Do not repeat the old stale-bundle claim or infer generated
entrypoint compatibility from parity alone.

The
[step-2 receipt](./ui-template-maintenance.plan/evidence.md#lifecycle-pilot-preparation-evidence)
now establishes the previously missing bounded artifact proof at `ce341a391`:

1. Authored/embedded parity passed for both UI templates, their specimen type barrels, and
   `tmpl.pkg/src/common/t.ts`, along with the existing style/barrel parity targets.
2. Named materialized `LifecyclePlain` and `LifecycleController` specimen/debug entrypoints and type
   barrels passed the generated package's declared check task against workspace-local owner APIs.
   The generated package configuration was unchanged; dependency localization used the existing
   `TmplTesting.LocalRepoAuthorities` seam.
3. No discrepancy required a template, bundle, or dependency change. The one-off probe was retired;
   published dependencies, browser paint, and generated controller replay safety remain unproven.

Historical lifecycle tests prove real-controller/dual-host behavior, rendering, fresh-worker
hydration, reset, and storage-failure handling. They do not prove browser paint, controller Strict
Mode replay safety, or storage durability. See the evidence record for retained substrate limits.

## Scoped-style contract

Authority: `code/-tmpl/-templates/tmpl.m.mod.ui/ui.tsx`, `use.Styles.ts`, and the registration hook
under `code/sys.ui/ui-react/src/use/use.StylesheetRule/`.

The original shared selector accumulated competing theme literals; pooled-rule deduplication meant
Light → Dark → Light could retain Dark's winning rule. Preserve isolated paint, not the defective
mixed-theme baseline.

- `D.displayName` is the template's sole component identity. Resolve the theme once in the root;
  pass `{ component, theme }` into `useScopedStyles`, and use the same identity on `data-component`.
  The helper returns `t.Style.Props`; public props remain `theme?: t.CommonTheme`.
- Keep theme-independent descendant declarations and theme-dependent root bindings separate. Compose
  `css(styles.base, scoped, props.style)` into the actual root, caller last. Every nested root
  redeclares its own values. This merges declarations, not existing class names. Arbitrary
  overlapping selectors from different component owners are not a promised isolation boundary.
- Each unconditional rule block owns its selector, private names, registration, and returned values.
  Derive names from `Obj.hash([component, selector])`, using lowercase `--scoped-${key}-*` keys for
  both definitions and `var(...)` references. Theme is not a key input. No dynamic hook loops.
- The fresh local `Object.assign` accumulator supports independently composable/removable blocks;
  deleting all blocks leaves an empty result. Source `satisfies t.Style.Props` checks compatibility,
  not dynamic key spelling, uniqueness, color validity, or definition/reference correspondence.
- Deleting optional styling removes its file, import, call, and composition argument without
  changing root identity or ordinary styling. No per-instance selector IDs, public tokens, global
  theme switches, extra registry, or pooled-sheet disposal.
- Canonical generated names are the input domain, not arbitrary selector text. Preserve the quoted
  attribute selector and `code` specificity **0,1,1**. `Pkg.toString` and camel-to-kebab conversion
  are not escaping utilities. The hash is transient and collision-possible, not a persistent
  identity.
- Preserve the template's isolated recipe: alpha **0.8 / 0.03 / 0.15** for
  foreground/background/border; monospace **600**, **0.85em**, line-height **1**, padding **[2,
  4]**, radius **4**, solid **1px** border. `Color.alpha` sets alpha; inheritance/currentColor or
  multiplying an existing alpha changes paint. Consumer-specific recipes must retain their own
  values.

### Registration versus isolation

`useStylesheetRule` delegates to `Style.Dom.stylesheet().rule` in a dependency-less
`useInsertionEffect` on each committed render. It accepts substrate values/arrays/options, discards
the receipt, and returns no cleanup. No render-time registration, local cache, subscription, theme
policy, arbitrary stylesheet text, or caller dependency array belongs in the hook.

Registration is additive/deduplicated, not replacement, rollback, cleanup, or A → B → A cascade
restoration. Inputs must remain stable through render/commit; mutations without a render are not
observed. Preserve substrate errors. Registration occurs before layout setup and not on abandoned
renders or SSR; this is not CSS extraction or a styled-server-paint guarantee. React 19.3.1
insertion effects are distinct from layout/passive Strict Mode replay; prove real remounts
separately.

Changing only the hook does not fix theme interference. Consumer adoption also needs root bindings
and composition, while preserving its identity, font loading, and original rule organization.

## Scoped-style acceptance

The final independent review and adjudication found no production blocker, required consolidation,
or blocking residue. Retain the ten-file test split: authored integration, named materialization,
initial-registration timing, isolated browser paint, report ownership, runner controls, and byte
parity have distinct failure boundaries. The final bounded proof passed **5 suites / 14 steps**,
generated runtime/check/build, and Chrome **56 complete comparisons**. Counts are historical
receipts, not fresh verification of later changes.

The human accepted the supplied Chrome/Firefox/Safari evidence and closed routine manual collection.
Additional repaired Chrome manual captures were not supplied; acceptance does not manufacture them.
The [evidence record](./ui-template-maintenance.plan/evidence.md#human-browser-acceptance) preserves
versions, report provenance, visual observations, and archival limits without committed PNGs.

One fixture limitation is accepted and deferred: receipt fetch in
`code/-tmpl/src/-test/styles.browser/ui.tsx` lacks timeout and active-run unmount cancellation; a
stalled receiver can leave controls busy. Optional correction belongs there and in
`-m.mod.ui.styles.runner.test.tsx`, with abort-aware timeout/unmount tests, not a new runner
abstraction. It does not invalidate completed comparisons or affect production styling.

Localized workspace dependencies, generated-only React deduplication, computed styles, human visual
acceptance, untouched generated configuration, and published compatibility remain separate claims.
No additional routine screenshot collection or blind pass is required absent a new concrete risk.

## Consumer migration: re-entry boundary

Before source edits, record the exact cohort: path, owner, existing behavior, proposed delta,
consumer-specific verification, and adopt/defer disposition. Text matches and landed template proof
do not establish equivalence. Keep lifecycle and style commits separate; obtain scope for divergent
policies. Empty cohorts may be removed only with human agreement.

Paths below are relative to `code/sys.ui/ui-components/src/ui.react/ui/`.

### Scoped-style cohort: ActionProbe and Prose.Manuscript only

Run the bounded style migration before the wider specimen-lifecycle migration. Its prerequisites are
`41db307d7` and `917bd0922`, not consumer attachment adoption or lifecycle artifact acceptance. The
`code/` filename inventory contains only the repaired template and these two `use.Styles.ts`
consumers; each consumer has one production hook caller. This is a two-owner boundary, not a
workspace-wide stylesheet migration.

- **Adopt ActionProbe styles:** `ActionProbe/use.Styles.ts` and `ActionProbe/ui.Probe.tsx`. Replace
  passive registration and ineffective stylesheet cleanup with insertion-phase registration and
  root-owned theme bindings. Preserve `${pkg.name}:ActionProbe`, code line-height **1.9**, all other
  isolated declarations, handlers, content, layout, and caller-last composition. Descendants such as
  `ActionProbe/-spec.samples/Foo.tsx` are behavior evidence, not a specimen-refactor target.
- **Adopt Prose.Manuscript styles:** `Prose.Manuscript/use.Styles.ts`, `Prose.Manuscript/ui.tsx`,
  and `Prose.Manuscript/u.styles/{mod.ts,u.init.ts,u.rule.code.ts,u.rule.headings.ts}` as needed.
  Apply the same registration/binding change while preserving `D.componentAttr`,
  `useFontBundle(ETBook)`, and separate heading/code declarations. Preserve code line-height **1**
  and h1's ETBook/Georgia/serif family, weight **400**, size **3em**, and line-height **1.1**.
- Allow necessary local/common import plumbing and focused consumer tests/fixtures. Keep hook calls
  unconditional in the React hook; declaration helpers must not hide hooks in arbitrary callbacks.
  Identity belongs to the component root independently of removable optional styling. No new shared
  styling framework, per-instance IDs, registry, or public styling API is needed.
- Exclude all specimen-lifecycle/persistence changes, Text.Label, other consumers, dependency
  refreshes, template/bundle regeneration, and unrelated cleanup. Remove obsolete style-only
  lifecycle machinery only within the two adopted consumers; do not change substrate ownership.

Consumer verification obligations:

1. Preserve independent pre-change isolated Light/Dark recipes as paint oracles. Compare actual
   consumer roots and code descendants, plus Manuscript headings; do not derive expectations from
   the new helper or use the template's line-height for ActionProbe.
2. Exercise both mount orders, Light → Dark → Light updates, real remounts, and nested same-owner
   roots in test fixtures. Prove complete relevant computed declarations and caller precedence, not
   merely rule registration, class names, or PASS counts. Do not add production test-only props.
3. Verify insertion-phase integration before child layout observation, unchanged root identities,
   Manuscript font loading, and independent rule-block removal/composition. Preserve existing
   ActionProbe activation tests and Manuscript API coverage; do not weaken assertions to pass.
4. Use focused `@sys/ui-components` tests and `deno task check`; use the established browser
   build/verified-Dist proof route for computed paint, with actual workspace consumer imports and
   explicit dependency authority. No bespoke server, permission widening, or infrastructure
   redesign. Record commands, results, and evidence limits; existing template receipts are not
   consumer proof. No routine new manual screenshot matrix is required.

The human accepted the completed 140-comparison consumer browser run as one-off migration evidence
and explicitly rejected retaining its multi-minute harness. Keep the fast consumer regressions;
remove the temporary generated-package browser harness and its dedicated task/permission preset. The
[consumer receipt](./ui-template-maintenance.plan/evidence.md#consumer-scoped-style-verification)
records the observed result, provenance, limits, and local recovery copies. This migration does not
add a permanent browser-build CI workload or require a repeat run merely to retire that harness.

### Lifecycle decisions: scope, persistence, and proof

The human agreed D1–D3 below. This is cleanup of ownership, not a return to the original template or
permission to remove a specimen's later behavior. Plan approval does not authorize implementation.

#### D1 — package inventory, then a two-consumer pilot

- Inventory devharness specimens throughout `code/sys.ui/ui-components` only. Start with a shallow
  scan for module names, exact specimen/debug paths, existing attachment use, and obvious
  exceptions. Do not solve every migration during discovery or claim filename/text matches prove
  equivalence.
- Migrate **Text.Label + Prose.Manuscript first** after preparation and implementation
  authorization. ActionProbe follows in its own landing unit, not this pilot and not a silently
  dropped exception.
- Inspect each candidate before changing it. Shared template ancestry is a starting point, not proof
  that current effects, storage, callbacks, or layout are equivalent. Bring policy differences to
  the human rather than mechanically replacing code.
- Learn a short repeatable workbook from the pilot, then apply it individually to later consumers.
  Keep it in this plan; no migration framework, automatic rewrite, or separate planning hierarchy.

Known surfaces and behavior to preserve:

- **Text.Label:** `Text.Label/-spec/-SPEC.tsx`, `Text.Label/-spec/-SPEC.Debug.tsx`, and
  `Text.Label/-test/-spec.test.tsx`. Retain controls, sample content/composition, selection,
  activation, storage key/defaults, legacy-field fallback, signal identity, grid layout, and host
  traceline. Adapt the existing persistence test to a live attachment without weakening its
  assertions. Do not reintroduce the removed stylesheet.
- **Prose.Manuscript:** `Prose.Manuscript/-spec/-SPEC.tsx` and
  `Prose.Manuscript/-spec/-SPEC.Debug.tsx`, plus focused consumer test coverage as needed. Retain
  the Light specimen default, fill/grid layout, controls, renderer, storage fields, and signal
  identity. Its existing API test is not lifecycle integration proof; production styles/font loading
  stay out of this change.
- **ActionProbe:** migrate `ActionProbe/-spec/-SPEC.tsx` and `ActionProbe/-spec/-SPEC.Debug.tsx`
  separately from the pilot. The human-approved boundary keeps `resultVisible()` and `reset()` as
  explicit commands with direct persistence, including while detached. `ActionProbe/m.Signals.ts`
  and `ActionProbe/m.Signals.persist.ts` remain inspection surfaces, not edit targets. Bind
  automatic debug preference projection and host theme, redraw, and size-mode synchronization to
  attachments; do not promise silence for explicit commands.

#### D2 — retain state, bound side effects

The pilot follows the existing lifecycle contract:

- Hydrate signals once when the debug factory is created, retaining current keys, defaults, fields,
  and fallback behavior. Create an inert attachment owner, not a long-lived persistence effect.
  Existing `LocalStorage.immutable` initialization may seed missing storage and reuse a cached ref;
  inert ownership does not mean zero construction-time storage IO or a fresh-registry guarantee.
- First attachment starts the shared preference projection; additional hosts share it. Last detach
  stops it. While disconnected, signal changes remain in memory without reactive preference writes.
- Reattachment projects the retained specimen values rather than reloading storage over them.
  Preserve unrelated stored fields. Persistence remains best effort, not retry or durability.
- Preserve signal objects across reset and detach/reattach; reset still restores the consumer's
  intended defaults. Retain controls, content, callbacks, layout, and attached redraw/theme
  behavior.
- Scope redraw and theme synchronization to their attachment and keep them separate. Unrelated knobs
  must not overwrite custom host paint. Detached silence covers attachment-owned effects; it does
  not cancel running callbacks or change React-owned hooks and direct actions automatically.

#### D3 — minimal, durable proof

The coverage below is an acceptance contract, not a repeated test matrix for every consumer.
`-test/-specimen-lifecycle.test.tsx` contains concrete pilot integration journeys, not universal
coverage for the remaining inventory. Reuse controller/storage setup where it is actually shared; do
not copy these journeys or add a mandatory lifecycle matrix for each migration. Each later consumer
still needs bounded evidence of its actual wiring and distinctive behavior, not a permanent test
file. Ordinary migrations default to temporary actual-suite probes under the workbook's retention
rule. The already-landed pilot and ActionProbe coverage is not a template for future additions;
pruning already-landed tests requires separately authorized consumer work.

- Keep lifecycle-mechanism coverage at its owner (`m.Spec/-u.attachments.test.ts` and the admission/
  retirement tests). Reuse the existing template lifecycle proof for shared template policy; do not
  copy its full dual-host, reentrancy, failure, or hydration matrix into each consumer.
- Prove actual consumer wiring through real specimen initialization and retirement, not only a
  manually attached debug factory. Use temporary integration probes to detect missing or escaped
  redraw/theme/persistence ownership and verify preservation of each consumer's behavior. Permanent
  consumer coverage requires the separate retention justification in the workbook.
- The pilot covered creation/hydration, first attach, shared-host continuity, last-detach silence,
  reconnect, repeat init/replacement, and harness reset/disposal across owner and consumer layers.
  This historical allocation is not a mandatory matrix for later consumers. Distinguish harness
  reset from the debug reset control; owner proof alone does not establish consumer wiring.
- Prefer extending existing tests. Retain strong control, default/fallback, serialized-preference,
  and signal-identity assertions. Observe actual storage bytes where persistence is the contract;
  when testing duplicate effects, count projection attempts rather than trusting deduplicated
  writes.
- Use narrow red/green or sensitivity evidence when practical. Sensitivity establishes that a test
  detects a fault, not that its permanent maintenance cost is justified. Do not retain checks for
  obsolete code shape, copied mechanism suites, or a generic migration-test framework.
- Before handoff, record migration evidence and remove temporary probes and exclusively used setup.
  Preserve justified durable regressions, then rerun the retained affected tests and checks. This
  cleanup belongs to the same authorized implementation pass, not a later human request.
- Use focused consumer tests and the owner check. Keep generated authored/embedded parity and named
  generated `-SPEC.tsx`/debug-factory type checks as separate artifact evidence, with dependency
  authority named. The step-2 receipt closes that artifact gap for its recorded baseline; it is not
  consumer implementation proof and need not be repeated if its inputs remain unchanged.
- No browser harness, permanent migration CI workload, dependency refresh, or bundle rewrite merely
  to establish this cleanup. Finish with a residue pass over touched files, tests, and fixtures.

#### Historical pilot contracts

Text.Label and Prose.Manuscript retained promise-returning factories, signal identity, defaults,
storage keys/fields, controls, and component behavior. Label leaves subject size omitted, uses grid
and its Samples renderer, and applies initial traceline 0.03 after theme setup. Later theme changes
retain harness defaults, including Dark 0.08. Manuscript retains fill/grid with omitted margin,
preserving the harness default of 50.

The pilot's seven-path source/test boundary, actual-suite journeys, storage isolation, two-host
proof, negative controls, and verification commands are recorded in the
[pilot receipt](./ui-template-maintenance.plan/evidence.md#consumer-lifecycle-pilot-verification).
Those retained tests were a historical pilot decision, not a requirement to reproduce per-consumer
lifecycle matrices or preserve every inherited assertion. Workbook rule 4 governs retention review.

#### Historical ActionProbe contracts

ActionProbe distinguishes automatic projection from explicit detached command persistence. The
public Signals API, async setup, React ownership, controls, sample callbacks, and unrelated storage
fields remain intact. Shared projection owns theme/debug/env/actOn/sizeMode, not result visibility.
Its attachment preserves fill-y margin 100, auto size [null, null], grid, and both 420 widths.

The retained journey protects automatic-effect retirement versus detached visibility/reset commands
and reconnect from retained signals. Layout/configuration catalogues were not retained. Shared
fixture mechanics remain in `src/-test/u.fixture.specimen-lifecycle.ts`, exported through
`src/ui.react/-test.ts` with one-way imports; no wiring or assertion matrix belongs in the fixture.
The [ActionProbe receipt](./ui-template-maintenance.plan/evidence.md#actionprobe-attachment-proof)
owns the seven-file proof boundary, executed commands, controls, lint findings, and evidence limits.
Older callback syntax is not current guidance; apply workbook rule 8 to new authorized work.

#### Historical Anchor and Bullet/BulletList contracts

- Anchor retains synchronous setup, legacy examples precedence/deletion, signal identity, explicit
  subject size clear, grid, debug width 480, initial traceline 0.05, and host footer padding [12,
  16]. The footer reads current theme as host chrome. See the
  [migration and retention receipt](./ui-template-maintenance.plan/evidence.md#anchor-attachment-proof)
  for executed commands, negative controls, pruning, and test renames.
- Bullet remains synchronous and ephemeral, with no storage or reset API. BulletList remains async,
  with shared preference projection and reactive width. Their separate implementations share a
  landing, not a persistence policy. See the
  [pair receipt](./ui-template-maintenance.plan/evidence.md#bullet-and-bulletlist-attachment-proof).

Both units retired temporary lifecycle probes in the implementation pass. Their receipts are
historical wiring evidence, not ongoing protection of every consumer attachment. Statements that
existing assertions were preserved describe those passes only, not retention authority. The
workbook's rule 4 governs future review; already-landed test pruning requires separate
authorization.

#### Fixture and setup lessons

Use literal suite imports and public storage-ref seeding; isolated storage does not promise a fresh
immutable registry. Retain raw transport observation after controller disposal so escaped redraws
remain visible. The fixture's public `Event` type is clarity, not a new safety guarantee; `DevEvent`
narrowing was rejected because the bus accepts general events. Do not restore arbitrary waits,
cache-busting loaders, or redundant cleanup wrappers.

The
[fixture/async-boundary receipt](./ui-template-maintenance.plan/evidence.md#fixture-refinement-and-async-boundary-review)
records those decisions and the inspected Automerge worker-readiness examples. These support setup
contract preservation, not an endorsement of those consumers' resource ownership. The
[final pilot receipt](./ui-template-maintenance.plan/evidence.md#blind-review-disposition-and-final-verification)
records removal of lint suppressions without changing factory signatures or workspace lint policy.

## Execution discipline

- Reopen owning tasks and source before authorized work; preserve unrelated dirty files and recovery
  bytes. Use focused regressions and owner checks, not broad prep or dependency refreshes.
- Template bundle changes use inspected `code/-tmpl/-scripts/task.bundle.ts` through
  `deno task prep:bundle` from `code/-tmpl`. Preserve pre-write bytes and inspect exact entry
  deltas. `src/m.tmpl/-test/-u.makeBundle.test.ts` also rewrites the real bundle; do not run it
  casually.
- Keep generated setup, raw byte parity, emitted CSS, attached CSSOM, computed paint, and published
  compatibility as separate proof layers. Use the normal generated entry/build/verified-Dist route;
  do not revive the failed ui-dev `/@fs/` route, standalone app, broad preset, or Deno shim.
- Preserve the plan's identity header and exact-file formatting. Plan artifacts stay separate from
  source-code commits. No staging, commit, profile change, or temporary-root deletion is implicit.
- Review the retained-fixture profile grant separately at closeout; its path and recovery anchors
  are in the evidence record. This cleanup remains independent of scoped-style acceptance.

## Follow-on inventory — `code/sys.ui`

Scope of `docs(tmpl): inventory UI specimen lifecycle follow-ons across other sys packages`. At
`6039ece20`, reviewed `code/sys.ui/ui` first, then lightly swept `code/sys.ui/ui-css`,
`code/sys.ui/ui-dev`, `code/sys.ui/ui-dom`, `code/sys.ui/ui-react`, and `code/sys.ui/ui-state`.
Excluded all `-archive` subtrees, including `/Users/phil/code/org.sys/sys/-tmp/-archive`, and left
`ui-components`, drivers, and deploy out of this pass. Cross-checked specimen and registry paths
with harness imports and lifecycle call-sites. Followed lazy imports, including addressable but
unlisted specimens. This was source review only, not evidence of a reproduced leak or browser run.

**10 live registrations reviewed: 3 follow-ons, 7 no change.** Test-only and unregistered specimens
are accounted for separately. These dispositions do not authorize follow-on source work.

### `@sys/ui` — two follow-ons, two no change

`code/sys.ui/ui/src/-test/entry.tsx` uses `specsFor` from `src/-test/-specs.ts`. Paths in this
section are relative to `code/sys.ui/ui`.

- **Files.InfoPanel — migrate.** `src/ui.react/ui.files/ui.InfoPanel/-spec/-SPEC.tsx` starts unowned
  tracked redraw on each init and uses context-only theme paint. Its `-SPEC.Debug.tsx`
  unconditionally projects theme, title, animation, debug, `events.enabled`, and fields. Bind shared
  projection and separate host paint/redraw. Preserve async setup, hydration, the 360-wide grid,
  stable Root, controller and signal identity, and transient snapshot. `../u.controller.ts` owns the
  controller's revision observer. `-u.connect.ts` owns a module-scoped sample websocket reached
  through explicit connect/disconnect and Debug reset; harness retirement must not disconnect it or
  cancel a pending operation. Redesigning its sharing or async ordering is out of scope.
- **Files.InfoPanel.Config — migrate.** `src/ui.react/ui.files/ui.InfoPanel.Config/-spec/-SPEC.tsx`
  has the same host effect pattern. Its `-SPEC.Debug.tsx` unconditionally projects theme, debug,
  reorder, items, and `cursorEnabled`, not the cursor model. Preserve async setup, a saved `false`,
  field order and dividers, 360-wide grid, and controlled cursor/item callbacks. `../ui.tsx` and
  KeyValue own keyboard entry, divider handling, and navigation; keep them outside attachments.
- **Passkey integration — no change in this workbook.**
  `-sample/passkey/ui/-spec.integration/-SPEC.tsx` owns one `openSample` and debug factory per
  admitted context; disposal releases both. `-sample/passkey/ui.host/u.sample.ts` owns runtime
  startup and page listeners; `ui.Connected.tsx` owns React subscriptions only. The host effects and
  preference writer follow context lifetime, not reset retirement. Preserve session/operation
  continuity across reload of that context and keep another context independent. Do not convert it
  to a shared sample or attachment-owned runtime.
- **Passkey pure view — no change in this workbook.** `-sample/passkey/ui/-spec/-SPEC.tsx` is lazy
  and addressable via `specsFor`, not listed in the main index. It owns fixture/intent state,
  effects, and a preference writer per context and releases them on disposal. Only theme/debug
  persist. The same context retains its state on reload; a new context rehydrates preferences and
  starts fresh presentation state. It records intent only; it does not open an account runtime.

For both Passkey entries, this is preservation of an explicit policy, not a finding that harness
reset retires their work. The [Passkey plan](../@sys.ui/passkey-panel.plan.md) preserves context
ownership, and `-sample/passkey/ui/-test/-spec.lifecycle.test.tsx` covers cached-suite re-entry,
concurrent contexts and disposal. Any future change to redraw/paint or projection at reset needs
separate Passkey-owner scope; keep navigation and runtime behavior out of these migration units.

### Sibling sweep

- **`ui-dev` — one follow-on.** Its browser entry and `-test/-entry.test.ts` consume the six live
  imports in `code/sys.ui/ui-dev/src/ui.react.devharness/-test/-specs.ts`. Paths below are relative
  to `code/sys.ui/ui-dev/src/ui.react.devharness`.
  - **MySample — DevHarness demo, not Passkey.** In `-test/sample.specs/-SPEC.MySample.tsx`, each
    init calls `Keyboard.on('CMD + KeyK', ...)` to log the matching shortcut and discards the
    cleanup handle. `code/sys.ui/ui-dom/src/m.Keyboard/m/m.Keyboard.Monitor.ts` shares the DOM
    listeners but creates a separate subscriber per call when a document is available. The missing
    cleanup is visible in source; duplicate delivery was not reproduced in this inventory. Retire
    only the logging subscriber with its specimen attachment. Leave `MySample.tsx`'s React
    `useKeyboard` hook, `DevBus.events(ctx)`'s context-owned view, context state, debug commands,
    and the delayed debug renderer unchanged.
  - **Harness and ModuleList — no change.** `ui/Harness/-SPEC.tsx` registers a nested Harness with a
    lazy spec import; React owns the inner controller. `ui/ModuleList/-SPEC.tsx` has static setup,
    lazy renderer imports, and explicit callbacks, not an automatic init subscription.
  - **DevTools, Size, and Empty — no change.** `-test/sample.DevTools/-SPEC.tsx` and its
    `DevTools.tsx` use explicit commands and initial debug-row registration; the button owns its
    pointer hook. `-test/sample.specs/-SPEC.Size.tsx` exercises direct renderer/size commands, not
    reactive init work, and `-SPEC.Empty.tsx` only reads the context. Do not normalize sample state
    or layout in a lifecycle pass.
  - **Not additional live registrations.** `-test/sample.specs/Specs.mts` also lists MySample,
    Empty, Error and Fail; no live entrypoint importing that map was found in the sweep. Error/Fail
    are intentional failure cases (Fail also appears in `-test/headless/headless.TEST.v.ts`).
    `-test/sample.specs/newFile.tsx` is an unregistered throw-on-init copy. The two
    `-test/sample.specs.unit-test/` suites are controller test fixtures. No migration proposed for
    these or for inline owner-test suites that deliberately exercise lifecycle boundaries.
- **`ui-css`, `ui-dom`, `ui-react`, `ui-state` — no candidates in the light sweep.** No live harness
  registrations or specimen init call-sites found. `ui-dom`'s keyboard monitor and `ui-react`'s
  hooks are supporting owners, not additional specimens. This is a bounded search result, not a
  lifecycle audit of every primitive.

### Proposed migration units and closing proof

1. `fix(ui): bind Files.InfoPanel specimen effects to attachments` — Change the specimen/debug pair
   only. Load the registered suite with isolated storage; verify projection starts on first attach,
   repeat init does not stack, reset A leaves B active, and last detach/reconnect stops and resumes
   projection without rehydrating. Prove snapshot updates redraw without persisting or repainting;
   use a fake transport to distinguish explicit disconnect from harness reset without a live
   websocket or a new production test seam. Keep controller and panel tests at their owners.
2. `fix(ui): bind Files.InfoPanel.Config specimen effects to attachments` — Change the
   specimen/debug pair only. Seed reorder and cursor flags, mount the registered subject and
   exercise a real item change or divider insertion; distinguish persisted items from the transient
   cursor. Verify re-init, reset/retirement, and reconnect without a duplicate writer or lost order.
   Retain the existing Config cursor, divider, and field tests, not a new specimen matrix.
3. `fix(ui-dev): retire the MySample keyboard subscription with its attachment` — Change the
   MySample specimen only. In the registered suite, send one matching keydown per check and count
   the init shortcut's log: once after repeat init, none after reset without context disposal,
   once after reconnect, and none after disposal. Do not stop the shared keyboard monitor or
   unmount the React hook to make the reset check pass. Keep the headless registry check, but do
   not count it as proof of keyboard delivery.

Reopen the owning tasks before each authorized unit, prove with actual registered suites, and rerun
the affected owner tests and type checks on the retained tree. Use temporary probes for consumer
wiring unless an assertion independently earns retention under the workbook.

## TODO — driver inventory

- [ ] `docs(tmpl): inventory UI specimen lifecycle follow-ons across driver packages` — After the
      three migrations above, trace live specimen registrations under `code/sys.driver/*`, excluding
      every `-archive` subtree. Record owners, dispositions, and proof requirements. This is a
      discovery pass only; propose driver migrations from its findings, not before.

## TODO — deploy inventory decision

- [ ] After the driver inventory, decide whether `/Users/phil/code/org.sys/sys/deploy/*` warrants a
      separate discovery pass. If selected, scope it using the same workbook and record live
      specimen entrypoints, ownership constraints, and proof requirements. If skipped, record the
      reason as a scope decision, not a source-reviewed no-change finding. Do not scan `deploy/*`
      during the UI or driver passes or make this decision a prerequisite for either.

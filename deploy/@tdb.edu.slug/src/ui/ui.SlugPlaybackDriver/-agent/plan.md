# SlugPlaybackDriver Integration Plan

## ✅ DONE - Complete Foundation

### Phase 1: Pure Controller Implementation ✅
- ✅ Created `t.controller.ts` - Controller interfaces matching TreeHost pattern
- ✅ Created `u.createController.tsx` - Controller factory with Rx.toLifecycle
- ✅ Created `m.Controller.ts` - Module exports
- ✅ Created `mod.ts` - Public library interface
- ✅ Created `-test/-m.Controller.test.ts` - 5 unit tests, all passing
- ✅ Updated type barrels in `t.ts` - Clean type re-exports

**Result:** Minimal pure controller foundation ready for signal wiring

---

## 🎯 CURRENT PHASE - Understanding Data Flow

### Data Flow Analysis Complete
From upstream PlaybackDriver analysis:
- ✅ `loadTimelineFromEndpoint()` - Loads timeline bundle from HTTP manifests
- ✅ `Timecode.Playback.Util.buildTimeline()` - Builds timeline from experience data  
- ✅ `PlaybackDriver.Util.resolveBeatMedia()` - Resolves beats to media URLs
- ✅ `PlaybackDriver.useDriver()` - React integration for UI components

From slug client analysis:
- ✅ `loadTreeFromEndpoint()` - Loads slug-tree from HTTP endpoints
- ❌ **MISSING:** slug-tree → timeline bundle conversion

### Key Gap Identified
**Missing bridge:** `slug-tree → timeline bundle` conversion function

**Missing types:** Timeline bundle and experience data structures in slug client

---

## 🚀 PHASE 2 - Signal Wiring & Integration

### Step 2.1: Add Timeline Bundle Loader
**File:** `m.slug.client/loadTimelineBundle.ts` (NEW)
**Purpose:** Convert loaded slug-tree → PlaybackDriver timeline bundle
**Interface:**
```typescript
export const loadTimelineBundle = async (
  baseUrl: t.StringUrl,
  docid: t.Crdt.Id
): Promise<t.TimecodePlaybackDriver.Wire.Bundle<unknown>>
```

### Step 2.2: Enhance SlugPlaybackController  
**File:** `u.createController.tsx` (UPDATE)
**Purpose:** Add signal inputs (selectedPath, slots) and PlaybackDriver integration
**Interface:**
```typescript
type SlugPlaybackControllerArgs = {
  selectedPath: t.Signal<t.ObjectPath | undefined>;
  slots: t.Signal<t.TreeHostSlots>;
  resolveMedia?: (path: t.ObjectPath) => t.TimecodePlaybackDriver.Wire.Bundle;
};
```

### Step 2.3: Integration Tests
**File:** `-spec.integration/TreeHostPlayer.integration.test.ts` (NEW)
**Purpose:** Test TreeHostController + SlugPlaybackController working together
**Coverage:** End-to-end signal flow and aux slot injection

---

## 🎯 PHASE 3 - External Orchestration

### Step 3.1: Complete Integration
**Purpose:** Connect TreeHost selection → SlugPlaybackController → PlaybackDriver in aux slot
**Files:** Integration tests and example orchestrator

---

## 🔧 ARCHITECTURE PRINCIPLES

### Pure Controllers
- TreeHostController: Manages tree navigation and slots
- SlugPlaybackController: Manages media playback and aux injection
- Both: Pure logic, React-agnostic, testable independently

### External Orchestrator  
- Bridges TreeHost ↔ SlugPlaybackController
- Provides data loading and media resolution
- Manages lifecycle between controllers
- Handles React component rendering

### Clean Separation
- **Logic:** Pure controller layer (signals, state management)
- **Data:** Client loading and transformation utilities  
- **UI:** PlaybackDriver React components
- **Integration:** Orchestrator wiring everything together

---

## ✅ READY TO PROCEED

**Foundation solid**, **data flow understood**, **integration path clear**.

**Next action:** Implement Step 2.1 - Timeline bundle loader in m.slug.client.
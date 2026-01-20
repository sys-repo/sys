# SlugPlaybackDriver Integration Plan - Rev 02

## 🎯 FOCUSED SCOPE: Bundle Creation → Playback Driver

### ✅ SINGLE RESPONSIBILITY: Static Slug → Working Driver

**Input:** Static slug JSON data (`SAMPLES.Slug['slug.9cC7y.*']`)
**Output:** Working SlugPlaybackDriver using upstream patterns
**Scope:** Bundle creation + driver wiring ONLY

---

## 🚀 SIMPLIFIED IMPLEMENTATION PATH

### PHASE 1: Bundle Creation (CURRENT)
**Function:** `createBundle(slug)` → `{ docid, spec, resolveAsset }`
- Convert static slug JSON into upstream `t.TimecodePlaybackDriver.Wire.Bundle` format
- Mirror upstream `u.loadTimelineFromEndpoint` logic but with static data
- Extract docid, composition, beats, and asset resolution

### PHASE 2: Driver Integration (NEXT)
**Function:** Complete SlugPlaybackController implementation
- Use bundle with upstream orchestrator pattern (`PlaybackDriver.useDriver`)
- Wire up controller interface to bundle-created driver
- Maintain upstream compatibility exactly

### PHASE 3: Testing & Validation (FINAL)
**Focus:** Verify end-to-end functionality
- Test bundle creation with static sample
- Test controller works with bundle
- Integration testing of complete flow

---

## 🔧 CLEAN ARCHITECTURE

### Bundle Creation Layer
```typescript
createBundle(slug) {
  // Convert slug.playback.json → upstream bundle format
  // { docid, spec: { composition, beats }, resolveAsset }
}
```

### Driver Orchestration Layer
```typescript
SlugPlaybackController {
  // Uses bundle with upstream orchestrator pattern
  // Mirrors use.Orchestrator logic for our use case
}
```

---

## 📋 IMPLEMENTATION STATUS

### ✅ COMPLETED
- Controller interfaces and factory skeleton
- Module exports and type barrels
- Static slug samples available (`SAMPLES.Slug['slug.9cC7y.*']`)

### 🎯 NEXT REQUIRED
- `createBundle(slug)` function implementation
- Complete SlugPlaybackController wiring with bundle

---

## 🚀 NEXT STEPS

### Step 1.1: Implement Bundle Creation
**Priority:** HIGH - Core foundation
**Files to create:**
- `u.createBundle.ts` - Convert slug JSON to upstream bundle format
- Follow upstream `u.loadTimelineFromEndpoint` pattern with static data

### Step 1.2: Complete Controller Implementation  
**Priority:** HIGH - End-to-end functionality
**Files to update:**
- `u.createController.tsx` - Wire bundle to PlaybackDriver via orchestrator pattern
- `t.controller.ts` - Remove TreeHost types, add bundle interface

### Step 1.3: Testing
**Priority:** MEDIUM - Validate implementation
- Unit test bundle creation with static sample
- Integration test controller with created bundle

---

## 🎯 ARCHITECTURE BENEFITS

- ✅ **Minimal Scope** - Focus on one clean transformation: slug → bundle → driver
- ✅ **Upstream Compatibility** - Uses exact same bundle format and orchestrator pattern
- ✅ **Testability** - Static data makes testing simple and deterministic
- ✅ **No False Starts** - Clear starting point with `createBundle(slug)`

---

**📝 CONCLUSION: Focused on `createBundle(slug)` → SlugPlaybackDriver implementation, ready for immediate work.**
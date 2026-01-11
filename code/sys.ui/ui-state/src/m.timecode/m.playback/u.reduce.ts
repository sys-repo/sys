import { type t } from './common.ts';
import { beatIndexFromVTime, clampBeatIndex, setCurrentBeat } from './u.ts';

/**
 * Playback.reduce
 *
 * Single authoritative transition function.
 *
 * Laws:
 * - Only `video:time` may auto-advance `currentBeat`.
 * - All other beat changes are discrete (explicit navigation or init).
 * - No side effects; commands are descriptive only.
 */
export const reduce: t.PlaybackStateLib['reduce'] = (prev, input) => {
  const cmds: t.PlaybackCmd[] = [];
  const events: t.PlaybackEvent[] = [];
  let state = prev;

  /**
   * Local mutation helpers.
   *
   * Intentional: keep the full decision surface in one file, while
   * concentrating invariant-preserving edits in small, local helpers.
   */
  const update = (next: t.PlaybackState) => (state = next);
  const setIntent = (intent: t.PlaybackIntent) => update({ ...state, intent });
  const ensureTimeline = (): t.PlaybackTimeline | undefined => state.timeline;

  const emitPhaseIfChanged = (next: t.PlaybackState) => {
    if (next.phase === state.phase) return;
    events.push({ kind: 'playback:phase', phase: next.phase });
  };

  const emitBeatIfChanged = (next: t.PlaybackState) => {
    if (next.currentBeat === state.currentBeat || next.currentBeat === undefined) return;
    events.push({ kind: 'playback:beat', beat: next.currentBeat });
  };

  const setPhase = (phase: t.PlaybackPhase) => {
    const next = { ...state, phase };
    emitPhaseIfChanged(next);
    update(next);
  };

  const setError = (message: string) => {
    const next: t.PlaybackState = { ...state, phase: 'error', error: { message } };
    events.push({ kind: 'playback:error', message });
    emitPhaseIfChanged(next);
    update(next);
  };

  const setDeckStatus = (deck: t.PlaybackDeckId, status: t.PlaybackDeckStatus) => {
    const next: t.PlaybackState = {
      ...state,
      decks: { ...state.decks, status: { ...state.decks.status, [deck]: status } },
    };
    events.push({ kind: 'playback:deck:status', deck, status });
    update(next);
  };

  /**
   * Re-arm the machine from a terminal "ended" state.
   *
   * When the user explicitly navigates or presses play after end,
   * we must return to phase:'active' so the runner/clock can resume.
   */
  const rearmIfEnded = () => {
    if (state.phase !== 'ended') return;
    const next: t.PlaybackState = { ...state, phase: 'active' };
    emitPhaseIfChanged(next);
    update(next);
  };

  /**
   * Resolve the segment index for a given beat index.
   *
   * Primary truth: beat.segmentId + segments[].id.
   * Fallback: legacy beat-range matching.
   *
   * Rationale:
   * - Runtime bugs show segment range matching can be incompatible with real timelines.
   * - `segmentId` is carried on beats and is the reducer’s authoritative grouping label.
   */
  const segmentIndexForBeat = (
    timeline: t.PlaybackTimeline,
    beatIndex: t.PlaybackBeatIndex,
  ): number => {
    const beat = timeline.beats[beatIndex];
    const segId = beat?.segmentId;
    const segments = timeline.segments;

    if (segId) {
      const byId = segments.findIndex((s) => s.id === segId);
      if (byId >= 0) return byId;
    }

    // Legacy fallback: [from, to) beat-range.
    return segments.findIndex((s) => s.beat.from <= beatIndex && beatIndex < s.beat.to);
  };

  /**
   * Deck load orchestration (pure intent).
   *
   * Policy:
   * - Active deck loads the selected beat's media (segment media).
   * - Standby deck preloads the next segment (by segment boundary, not beat).
   *
   * Note: we intentionally do not dedupe commands yet.
   */
  const loadForBeat = (beatIndex: t.PlaybackBeatIndex) => {
    const timeline = ensureTimeline();
    if (!timeline) return;

    const beat = timeline.beats[beatIndex];
    const url = beat?.media?.url;
    if (!url) return;

    const { active, standby } = state.decks;

    // Active deck: current beat media.
    cmds.push({ kind: 'cmd:deck:load', deck: active, beat: beatIndex });

    // Standby deck: next segment boundary preload.
    const segIndex = segmentIndexForBeat(timeline, beatIndex);
    const nextSeg = segIndex >= 0 ? timeline.segments[segIndex + 1] : undefined;
    if (!nextSeg) return;

    const preloadIndex = nextSeg.beat.from;
    const preloadBeat = timeline.beats[preloadIndex];
    const preloadUrl = preloadBeat?.media?.url;
    if (!preloadUrl) return;

    cmds.push({ kind: 'cmd:deck:load', deck: standby, beat: preloadIndex });
  };

  /**
   * If the user is in intent:'play', discrete navigation (seek/next/prev)
   * should keep playback running. Runtime seek does not force play.
   */
  const resumeIfPlaying = (next: t.PlaybackState) => {
    if (next.intent !== 'play') return;
    cmds.push({ kind: 'cmd:deck:play', deck: next.decks.active });
  };

  /**
   * Reduce input → next state.
   *
   * The cases are grouped by semantic role:
   * - Initialization & readiness
   * - Intent-driven actions (desire)
   * - Timeline navigation (explicit beat selection)
   * - Runtime media signals (observed reality)
   * - Time progression (the ONLY implicit beat advance)
   */
  switch (input.kind) {
    /**
     * Initialization & readiness
     */
    case 'playback:init': {
      const timeline = input.timeline;
      const initialBeat = clampBeatIndex(timeline, input.startBeat ?? 0);

      const next: t.PlaybackState = {
        ...state,
        phase: 'active',
        intent: 'stop',
        timeline,
        currentBeat: undefined,
        error: undefined,
        decks: {
          ...state.decks,
          active: 'A',
          standby: 'B',
          status: { A: 'empty', B: 'empty' },
        },
        ready: { ...state.ready, machine: true },
      };

      emitPhaseIfChanged(next);
      update(next);

      const seeded = setCurrentBeat(state, initialBeat, { cmds, events });

      // Immediate UI consistency: seed vTime to the selected beat boundary.
      const seededBeat = timeline.beats[initialBeat];
      update({ ...seeded, vTime: seededBeat?.vTime });

      loadForBeat(initialBeat);
      return { state, cmds, events };
    }

    case 'runner:ready': {
      const next: t.PlaybackState = { ...state, ready: { ...state.ready, runner: true } };
      update(next);

      // Compose readiness into a single explicit event.
      if (next.ready.machine && next.ready.runner) {
        cmds.push({ kind: 'cmd:emit-ready' });
        events.push({ kind: 'timecode:ready' });
      }

      return { state, cmds, events };
    }

    /**
     * Intent-driven actions (desire mutations)
     *
     * These express what the controller wants to be true.
     * Reality may temporarily diverge (buffering, stalls, etc).
     */
    case 'playback:play': {
      if (!ensureTimeline()) return { state, cmds, events };
      rearmIfEnded();
      setIntent('play');
      cmds.push({ kind: 'cmd:deck:play', deck: state.decks.active });
      return { state, cmds, events };
    }

    case 'playback:pause': {
      if (!ensureTimeline()) return { state, cmds, events };
      setIntent('pause');
      cmds.push({ kind: 'cmd:deck:pause', deck: state.decks.active });
      return { state, cmds, events };
    }

    case 'playback:toggle': {
      if (!ensureTimeline()) return { state, cmds, events };

      if (state.intent === 'play') {
        setIntent('pause');
        cmds.push({ kind: 'cmd:deck:pause', deck: state.decks.active });
        return { state, cmds, events };
      }

      rearmIfEnded();
      setIntent('play');
      cmds.push({ kind: 'cmd:deck:play', deck: state.decks.active });
      return { state, cmds, events };
    }

    case 'playback:stop': {
      if (!ensureTimeline()) return { state, cmds, events };
      setIntent('stop');
      cmds.push({ kind: 'cmd:deck:pause', deck: state.decks.active });
      return { state, cmds, events };
    }

    /**
     * Timeline navigation (explicit beat selection)
     *
     * These are discrete jumps, never time-driven.
     * Policy: navigation sets vTime to the target beat boundary for immediate UI consistency.
     */
    case 'playback:seek:beat': {
      const timeline = ensureTimeline();
      if (!timeline) return { state, cmds, events };
      rearmIfEnded();

      const nextBeat = clampBeatIndex(timeline, input.beat);
      const next = setCurrentBeat(state, nextBeat, { cmds, events });
      emitBeatIfChanged(next);

      const beat = timeline.beats[nextBeat];
      const nextState = { ...next, vTime: beat?.vTime };
      update(nextState);

      loadForBeat(nextBeat);
      resumeIfPlaying(nextState);

      return { state, cmds, events };
    }

    case 'playback:next': {
      const timeline = ensureTimeline();
      if (!timeline) return { state, cmds, events };
      rearmIfEnded();

      const curr = state.currentBeat ?? 0;
      const nextBeat = clampBeatIndex(timeline, curr + 1);
      const next = setCurrentBeat(state, nextBeat, { cmds, events });
      emitBeatIfChanged(next);

      const beat = timeline.beats[nextBeat];
      const nextState = { ...next, vTime: beat?.vTime };
      update(nextState);

      loadForBeat(nextBeat);
      resumeIfPlaying(nextState);

      return { state, cmds, events };
    }

    case 'playback:prev': {
      const timeline = ensureTimeline();
      if (!timeline) return { state, cmds, events };
      rearmIfEnded();

      const curr = state.currentBeat ?? 0;
      const nextBeat = clampBeatIndex(timeline, curr - 1);
      const next = setCurrentBeat(state, nextBeat, { cmds, events });
      emitBeatIfChanged(next);

      const beat = timeline.beats[nextBeat];
      const nextState = { ...next, vTime: beat?.vTime };
      update(nextState);

      loadForBeat(nextBeat);
      resumeIfPlaying(nextState);

      return { state, cmds, events };
    }

    /**
     * Runtime media signals (observed reality)
     *
     * These reflect what the media layer reports,
     * not what the controller intends.
     */
    case 'runner:error': {
      setError(input.message);
      return { state, cmds, events };
    }

    case 'video:ready': {
      setDeckStatus(input.deck, 'ready');

      const next: t.PlaybackState = {
        ...state,
        ready: {
          ...state.ready,
          deck: { ...(state.ready.deck ?? {}), [input.deck]: true },
        },
      };
      update(next);

      return { state, cmds, events };
    }

    case 'video:buffering': {
      // Buffering is runtime reality (status), not a machine phase.
      if (input.is) {
        setDeckStatus(input.deck, 'buffering');
      } else {
        // When buffering ends, reflect intent as best-effort.
        const status =
          state.intent === 'play' ? 'playing' : state.intent === 'pause' ? 'paused' : 'ready';
        setDeckStatus(input.deck, status);
      }
      return { state, cmds, events };
    }

    case 'video:playing': {
      if (input.is) {
        setDeckStatus(input.deck, 'playing');
        return { state, cmds, events };
      }

      if (state.decks.status[input.deck] === 'ended') {
        return { state, cmds, events };
      }

      if (!state.ready.deck?.[input.deck]) {
        return { state, cmds, events };
      }

      const status =
        state.intent === 'play' || state.intent === 'pause' ? 'paused' : 'ready';
      setDeckStatus(input.deck, status);
      return { state, cmds, events };
    }

    case 'video:ended': {
      const timeline = ensureTimeline();
      if (!timeline) return { state, cmds, events };

      setDeckStatus(input.deck, 'ended');

      // Standby ended is non-fatal: keep status only.
      if (input.deck !== state.decks.active) {
        return { state, cmds, events };
      }

      const prevIntent = state.intent;
      const currBeat = state.currentBeat ?? 0;

      const segIndex = segmentIndexForBeat(timeline, currBeat);
      if (segIndex < 0) {
        setError(`video:ended but current beat ${currBeat} has no resolvable segment`);
        return { state, cmds, events };
      }

      const nextSeg = timeline.segments[segIndex + 1];

      // Terminal end: no next segment.
      if (!nextSeg) {
        setIntent('stop');
        setPhase('ended');
        return { state, cmds, events };
      }

      const nextBeat = clampBeatIndex(timeline, nextSeg.beat.from);

      // Discrete jump: set current beat (may swap decks by segmentId), then ensure loads.
      const next = setCurrentBeat(state, nextBeat, { cmds, events });
      emitBeatIfChanged(next);

      const beat = timeline.beats[nextBeat];
      const nextState = { ...next, vTime: beat?.vTime };
      update(nextState);

      loadForBeat(nextBeat);

      // Preserve the user's play intent across the boundary.
      if (prevIntent === 'play') {
        cmds.push({ kind: 'cmd:deck:play', deck: nextState.decks.active });
      }

      return { state, cmds, events };
    }

    /**
     * Time progression
     *
     * This is the ONLY input allowed to advance the current beat automatically.
     * All other beat changes are explicit navigation.
     */
    case 'video:time': {
      const timeline = ensureTimeline();
      if (!timeline) return { state, cmds, events };

      /**
       * Hardening:
       * After terminal `video:ended(active)` we enter phase:'ended'.
       * Any subsequent `video:time` is stale (from a finished media element or clock)
       * and must not advance beats or smear vTime until the user explicitly rearms
       * the machine (play/seek/next/prev), which calls `rearmIfEnded()`.
       */
      if (state.phase === 'ended') {
        return { state, cmds, events };
      }

      const nextBeat = beatIndexFromVTime(timeline, input.vTime);

      // Always track vTime (even within the same beat) so UI can derive media vs pause phase.
      if (nextBeat === state.currentBeat) {
        update({ ...state, vTime: input.vTime });
        return { state, cmds, events };
      }

      const next = setCurrentBeat(state, nextBeat, { cmds, events });
      emitBeatIfChanged(next);

      // Preserve exact runner vTime (not just beat boundary vTime).
      const nextState = { ...next, vTime: input.vTime };
      update(nextState);

      loadForBeat(nextBeat);

      // Critical: if we're in intent:'play', auto-advance must re-assert deck play,
      // because runtime seek does not force play and pause windows may have paused media.
      resumeIfPlaying(nextState);

      return { state, cmds, events };
    }
  }
};

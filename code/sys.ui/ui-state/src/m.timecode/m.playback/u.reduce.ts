import { type t } from './common.ts';
import { beatIndexFromVTime, clampBeatIndex, setCurrentBeat } from './u.ts';

/**
 * Playback.reduce
 *
 * Single authoritative transition function.
 * - Only `video:time` may auto-advance `currentBeat`
 * - All other inputs are discrete state transitions
 * - No side effects; commands are descriptive only
 */
export const reduce: t.PlaybackStateLib['reduce'] = (prev, input) => {
  const cmds: t.PlaybackCmd[] = [];
  const events: t.PlaybackEvent[] = [];
  let state = prev;

  /**
   * Internal mutation helpers.
   *
   * These helpers are intentionally local:
   * they preserve invariants while keeping the full
   * decision surface visible in one file.
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
   * Deck load orchestration (pure intent).
   *
   * Policy:
   * - Active deck always loads the current segment media for the selected beat.
   * - Standby deck preloads the next segment (by segment boundary, not beat).
   *
   * Notes:
   * - We intentionally do not dedupe commands yet; being explicit is correct.
   * - The runner/runtime decides how `cmd:deck:load` is realized (src assignment, fetch, etc).
   */
  const loadForBeat = (beatIndex: t.PlaybackBeatIndex) => {
    const timeline = ensureTimeline();
    if (!timeline) return;

    const beat = timeline.beats[beatIndex];
    const url = beat?.media?.url;
    if (!url) return;

    const { active, standby } = state.decks;

    // Load the active deck with the current beat (segment) media.
    cmds.push({ kind: 'cmd:deck:load', deck: active, beat: beatIndex });

    // Find the segment containing this beat, then preload the *next* segment on standby.
    const segments = timeline.segments;
    const segIndex = segments.findIndex((s) => s.beat.from <= beatIndex && beatIndex < s.beat.to);

    const nextSeg = segIndex >= 0 ? segments[segIndex + 1] : undefined;
    if (!nextSeg) return;

    const preloadIndex = nextSeg.beat.from;
    const preloadBeat = timeline.beats[preloadIndex];
    const preloadUrl = preloadBeat?.media?.url;
    if (!preloadUrl) return;

    cmds.push({
      kind: 'cmd:deck:load',
      deck: standby,
      beat: preloadIndex,
    });
  };

  /**
   * Reduce input → next state.
   *
   * The cases below are grouped by semantic role:
   *   - Initialization and readiness
   *   - Intent-driven actions
   *   - Timeline navigation
   *   - Runtime media signals
   *
   * Ordering is intentional. Read top to bottom.
   */
  switch (input.kind) {
    /**
     * ─────────────────────────────────────────────────────────────
     * Initialization & readiness composition
     * ─────────────────────────────────────────────────────────────
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
      update(seeded);
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
     * ─────────────────────────────────────────────────────────────
     * Intent-driven actions (desire mutations)
     *
     * These express what the controller is trying to do.
     * Reality may temporarily diverge (e.g. buffering).
     * ─────────────────────────────────────────────────────────────
     */
    case 'playback:play': {
      if (!ensureTimeline()) return { state, cmds, events };
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

    case 'playback:stop': {
      if (!ensureTimeline()) return { state, cmds, events };
      setIntent('stop');
      cmds.push({ kind: 'cmd:deck:pause', deck: state.decks.active });
      return { state, cmds, events };
    }

    /**
     * ─────────────────────────────────────────────────────────────
     * Timeline navigation (explicit beat selection)
     *
     * These are discrete jumps, never time-driven.
     * ─────────────────────────────────────────────────────────────
     */
    case 'playback:seek:beat': {
      const timeline = ensureTimeline();
      if (!timeline) return { state, cmds, events };

      const nextBeat = clampBeatIndex(timeline, input.beat);
      const next = setCurrentBeat(state, nextBeat, { cmds, events });
      emitBeatIfChanged(next);
      update(next);
      loadForBeat(nextBeat);

      return { state, cmds, events };
    }

    case 'playback:next': {
      const timeline = ensureTimeline();
      if (!timeline) return { state, cmds, events };

      const curr = state.currentBeat ?? 0;
      const nextBeat = clampBeatIndex(timeline, curr + 1);
      const next = setCurrentBeat(state, nextBeat, { cmds, events });
      emitBeatIfChanged(next);
      update(next);
      loadForBeat(nextBeat);

      return { state, cmds, events };
    }

    case 'playback:prev': {
      const timeline = ensureTimeline();
      if (!timeline) return { state, cmds, events };

      const curr = state.currentBeat ?? 0;
      const nextBeat = clampBeatIndex(timeline, curr - 1);
      const next = setCurrentBeat(state, nextBeat, { cmds, events });
      emitBeatIfChanged(next);
      update(next);
      loadForBeat(nextBeat);

      return { state, cmds, events };
    }

    /**
     * ─────────────────────────────────────────────────────────────
     * Runtime media signals (observed reality)
     *
     * These reflect what the media layer reports,
     * not what the controller intends.
     * ─────────────────────────────────────────────────────────────
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

    case 'video:ended': {
      setDeckStatus(input.deck, 'ended');

      // If the active deck ended, the machine is ended (for now).
      if (input.deck === state.decks.active) {
        setPhase('ended');
      }

      return { state, cmds, events };
    }

    /**
     * Time progression.
     *
     * This is the ONLY input allowed to advance the current beat
     * automatically. All other beat changes are explicit.
     */
    case 'video:time': {
      const timeline = ensureTimeline();
      if (!timeline) return { state, cmds, events };

      const nextBeat = beatIndexFromVTime(timeline, input.vTime);

      // No beat change → no-op.
      if (nextBeat === state.currentBeat) return { state, cmds, events };

      const next = setCurrentBeat(state, nextBeat, { cmds, events });
      emitBeatIfChanged(next);
      update(next);
      loadForBeat(nextBeat);

      return { state, cmds, events };
    }
  }
};

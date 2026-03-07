import type { t } from './common.ts';

/**
 * Machine phase (orchestration, not media conditions).
 * Buffering is modeled via per-deck status (not as a phase).
 */
export type PlaybackPhase = 'idle' | 'active' | 'ended' | 'error';

/**
 * Desired playback intent (what the controller is trying to do).
 * Reality may temporarily diverge (e.g. buffering while intent is "play").
 */
export type PlaybackIntent = 'stop' | 'pause' | 'play';

/**
 * Per-deck media status (runtime reality).
 * Keep this small and explicit: buffering can occur mid-play.
 */
export type PlaybackDeckStatus =
  | 'empty'
  | 'loading'
  | 'ready'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error';

export type PlaybackDeckId = 'A' | 'B';
export type PlaybackBeatIndex = t.Index;

/**
 * A minimal, UI-focused view of the resolved timeline.
 * Keep this in ui-state (not std): this is the state machine’s working model.
 *
 * The runner is free to derive this from @sys/std timecode types.
 */
export type PlaybackTimeline = {
  readonly beats: readonly PlaybackBeat[];
  readonly segments: readonly PlaybackSegment[];
  readonly virtualDuration: t.Msecs;
};

export type PlaybackBeat = {
  readonly index: PlaybackBeatIndex;
  readonly vTime: t.Msecs;
  readonly duration: t.Msecs;

  /** Optional pause duration after this beat (UI shows this as "Pause"). */
  readonly pause?: t.Msecs;

  /** Segment correlation for grouping rows (UI shows segments + repeats). */
  readonly segmentId: t.StringId;

  /** Optional media identity hints for display/debug (URL/media type). */
  readonly media?: {
    readonly url?: t.StringUrl;
    readonly mime?: t.StringMimeType;
    readonly label?: string;
  };
};

export type PlaybackSegment = {
  readonly id: t.StringId;

  /**
   * Beat range in half-open form: [from, to)
   * - from: inclusive
   * - to: exclusive
   */
  readonly beat: { readonly from: PlaybackBeatIndex; readonly to: PlaybackBeatIndex };
};

/**
 * State
 */
export type PlaybackState = {
  /**
   * Orchestration phase (timeline attached, lifecycle), not "playing/paused".
   */
  readonly phase: PlaybackPhase;

  /**
   * Desired intent: what the controller is trying to do right now.
   */
  readonly intent: PlaybackIntent;
  readonly timeline?: PlaybackTimeline;
  readonly currentBeat?: PlaybackBeatIndex;

  /**
   * Runner-provided current virtual time (authoritative while running).
   * Used for within-beat derivations (e.g. media vs pause highlighting).
   */
  readonly vTime?: t.Msecs;

  /**
   * Deck ownership (kept abstract: runner maps this to actual players).
   */
  readonly decks: {
    readonly active: PlaybackDeckId;
    readonly standby: PlaybackDeckId;

    /**
     * Runtime reality per deck (buffering lives here).
     * The runner produces signals that let ui-state update these.
     */
    readonly status: { readonly [K in PlaybackDeckId]: PlaybackDeckStatus };
  };

  /**
   * A simple "gate" for readiness composition (no implicit `initial?:true`).
   */
  readonly ready: {
    readonly machine: boolean;
    readonly runner?: boolean;

    /**
     * Optional per-deck readiness gates (runner-provided).
     * This is a gate (boolean), distinct from decks.status (richer reality).
     */
    readonly deck?: { readonly [K in PlaybackDeckId]?: boolean };
  };

  /**
   * Error reporting stays data-only.
   */
  readonly error?: { readonly message: string };
};

/**
 * Pure reducer snapshot (state + effects).
 */
export type PlaybackSnapshot = {
  readonly state: PlaybackState;
  readonly cmds: readonly t.PlaybackCmd[];
  readonly events: readonly t.PlaybackEvent[];
};

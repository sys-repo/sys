import type { t } from './common.ts';

/**
 * Playback-time pipeline:
 *   normalized → playback spec.
 */
export type PlaybackLib = {
  /** Lift a normalized slug sequence into the generic playback spec. */
  fromNormalized(docid: t.Crdt.Id, normalized: t.SequenceNormalized): t.PlaybackSpec;

  /**
   * Load + normalize a sequence into a playback-ready spec.
   * Used when generating `slug.<docid>.playback.json`.
   */
  fromDag(
    dag: t.Graph.Dag.Result,
    yamlPath: t.ObjectPath,
    docid: t.Crdt.Id,
    opts?: { validate?: boolean },
  ): Promise<t.PlaybackSpec | undefined>;
};

/** Slug-specific playback spec: generic timecode spec + beat payload. */
export type PlaybackSpec = t.TimecodePlaybackSpec<t.SequenceBeatPayload> & {
  readonly docid: t.Crdt.Id;
  readonly meta?: t.SequenceNormalized['meta'];
};

/** Slug-scoped wrapper around the generic media resolver. */
export type PlaybackMediaResolver = t.MediaResolver;

/** Bundle of "what to play" + "how to resolve its media". */
export type PlaybackBundle = {
  readonly spec: t.PlaybackSpec;
  readonly resolveMedia: t.PlaybackMediaResolver;
};

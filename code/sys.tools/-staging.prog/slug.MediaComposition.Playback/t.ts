import type { t } from './common.ts';

/**
 * Playback-time pipeline:
 *   normalized → playback spec.
 */
export type PlaybackLib = {
  /** Lift a normalized slug sequence into the generic playback spec. */
  fromNormalized(docid: t.Crdt.Id, normalized: t.SlugSequenceNormalized): t.SlugPlaybackSpec;

  /**
   * TODO 🐷 ?
   */
  /**
   * Load + normalize a sequence into a playback-ready spec.
   * Used when generating `slug.<docid>.playback.json`.
   */
  fromDag(
    dag: t.Graph.Dag.Result,
    yamlPath: t.ObjectPath,
    docid: t.Crdt.Id,
    opts?: { validate?: boolean },
  ): Promise<t.SlugPlaybackSpec | undefined>;
};

/** Slug-specific playback spec: generic timecode spec + our beat payload. */
export type SlugPlaybackSpec = t.TimecodePlaybackSpec<t.SlugSequenceBeatPayload> & {
  readonly docid: t.Crdt.Id;
  readonly meta?: t.SlugSequenceNormalized['meta'];
};

/** Slug-scoped wrapper around the generic media resolver. */
export type SlugMediaResolver = t.MediaResolver;

/** Bundle of "what to play" + "how to resolve its media". */
export type SlugPlaybackBundle = {
  readonly spec: t.SlugPlaybackSpec;
  readonly resolveMedia: t.SlugMediaResolver;
};

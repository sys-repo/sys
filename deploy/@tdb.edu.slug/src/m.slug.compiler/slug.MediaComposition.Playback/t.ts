import type { t } from './common.ts';

/**
 * Playback-time pipeline:
 *   normalized → playback spec.
 */
export type SlugPlaybackLib = {
  /** Lift a normalized slug sequence into the generic playback spec. */
  fromNormalized(docid: t.Crdt.Id, normalized: t.SequenceNormalized): t.SlugPlaybackSpec;

  /**
   * Load + normalize a sequence into a playback-ready spec.
   * Used when generating `slug.<docid>.playback.json`.
   */
  fromDag(
    dag: t.Graph.Dag.Result,
    yamlPath: t.ObjectPath,
    docid: t.Crdt.Id,
    opts?: { validate?: boolean; trait?: t.SlugTraitGateOptions | null },
  ): Promise<t.ValidateResult<t.SlugPlaybackSpec>>;
};

/** Slug-specific playback spec: generic timecode spec + beat payload. */
export type SlugPlaybackSpec = t.Timecode.Playback.Spec<t.SequenceBeatPayload> & {
  readonly docid: t.Crdt.Id;
  readonly meta?: t.SequenceNormalized['meta'];
};

/** Slug-scoped wrapper around the generic media resolver. */
export type SlugPlaybackMediaResolver = t.Timecode.Playback.Resolver;

/** Bundle of "what to play" + "how to resolve its media". */
export type SlugPlaybackBundle = {
  readonly spec: t.SlugPlaybackSpec;
  readonly resolveMedia: t.SlugPlaybackMediaResolver;
};

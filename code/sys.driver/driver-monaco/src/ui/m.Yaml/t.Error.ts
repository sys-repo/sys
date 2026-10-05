import type { t } from './common.ts';

/** Library of YAML error helpers. */
export type Lib = {
  errorToMarker: ToMarker;
  errorsToMarkers: ToMarkers;
};

/** Convert a single YAML parser error into a Monaco editor marker. */
export type ToMarker = (
  monaco: t.Monaco.Monaco,
  model: t.Monaco.TextModel,
  error: t.YamlError,
) => t.Monaco.I.IMarkerData;

/** Convert a list of YAML parser errors into Monaco editor markers. */
export type ToMarkers = (
  monaco: t.Monaco.Monaco,
  model: t.Monaco.TextModel,
  errors: readonly t.YamlError[],
) => readonly t.Monaco.I.IMarkerData[];

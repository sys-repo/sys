import type { t } from './common.ts';

/**
 * Library of error helpers.
 */
export type EditorYamlErrorLib = {
  errorToMarker: t.YamlErrorToMarker;
  errorsToMarkers: t.YamlErrorsToMarkers;
};

/**
 * Convert a single YAML parser error into a Monaco editor marker.
 * - Handles both line/column and byte-offset positions.
 */
export type YamlErrorToMarker = (
  monaco: t.Monaco.Monaco,
  model: t.Monaco.TextModel,
  error: t.YamlError,
) => t.Monaco.I.IMarkerData;

/**
 * Convert a list of YAML parser errors into Monaco editor markers.
 * - Keeps owner discipline outside the helper.
 */
export type YamlErrorsToMarkers = (
  monaco: t.Monaco.Monaco,
  model: t.Monaco.TextModel,
  errors: readonly t.YamlError[],
) => readonly t.Monaco.I.IMarkerData[];

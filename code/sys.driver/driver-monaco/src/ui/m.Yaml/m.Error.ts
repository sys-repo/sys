import { type t } from './common.ts';
import { errorsToMarkers, errorToMarker } from './u.error.markers.ts';

export const Error: t.EditorYaml.Error.Lib = {
  errorsToMarkers,
  errorToMarker,
};

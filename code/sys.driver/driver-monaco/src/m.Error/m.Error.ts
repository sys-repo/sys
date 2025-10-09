import { useErrorMarkers } from '../ui/m.Markers.Error/use.ErrorMarkers.ts';
import { type t } from './common.ts';
import { toMarkers } from './u.markers.ts';

export const Error: t.EditorErrorLib = {
  toMarkers,
  useErrorMarkers,
};

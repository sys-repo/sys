import { useErrorMarkers } from '../m.Markers.Error/mod.ts';
import { type t, Error, slug } from './common.ts';

type D = t.Diagnostic;

/**
 * YAML-specialized wrapper: convert YAMLError → Diagnostic,
 * then delegate to the generic error-marker hook.
 */
export const useYamlErrorMarkers: t.UseYamlErrorMarkers = (args) => {
  const { errors, ...rest } = args;
  const owner = args.owner ?? `yaml-${slug()}`;
  const normalized: D[] = (errors ?? []).map(Error.toDiagnosticFromYaml);
  return useErrorMarkers({ ...rest, owner, errors: normalized });
};

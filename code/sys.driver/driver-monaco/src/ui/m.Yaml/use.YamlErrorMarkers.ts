import React from 'react';
import { useErrorMarkers } from '../m.Markers.Error/mod.ts';
import { type t, slug, Yaml } from './common.ts';

type D = t.EditorDiagnostic;

/**
 * Synchronize Monaco markers from YAML diagnostics or raw parser errors.
 */
export const useYamlErrorMarkers: t.UseYamlErrorMarkers = (args) => {
  const { errors = [], owner, enabled = true, ...rest } = args;
  const ownerRef = React.useRef(owner ?? `yaml-${slug()}`);

  // Normalize inputs → standard YAML diagnostics.
  const diagnostics = React.useMemo<t.Yaml.Diagnostic[]>(() => {
    return (errors ?? []).map(wrangle.asYamlDiagnostic).filter((x): x is t.Yaml.Diagnostic => !!x);
  }, [errors]);

  // Map YAML diagnostics → driver diagnostics for Monaco projector.
  const driverDiagnostics = React.useMemo<D[]>(
    () => diagnostics.map(wrangle.asEditorDiagnostic),
    [diagnostics],
  );

  // When disabled, feed an empty array to forcibly clear any existing markers.
  const effectiveDiagnostics = React.useMemo<D[]>(
    () => (enabled ? driverDiagnostics : []),
    [enabled, driverDiagnostics],
  );

  return useErrorMarkers({
    ...rest,
    owner: ownerRef.current,
    errors: effectiveDiagnostics,
  });
};

/**
 * Helpers:
 */
const wrangle = {
  asYamlDiagnostic(e: t.Yaml.Diagnostic | t.Yaml.Error): t.Yaml.Diagnostic | undefined {
    if (Yaml.Is.diagnostic(e)) return e;
    if (Yaml.Is.parseError(e)) return Yaml.Diagnostic.fromYamlError(e);
    return undefined;
  },

  asEditorDiagnostic(d: t.Yaml.Diagnostic): t.EditorDiagnostic {
    const base = { message: d.message, code: d.code, path: d.path } as const;

    if (Array.isArray(d.linePos) && d.linePos.length > 0) {
      const [a, b] = d.linePos as readonly [t.LinePos, t.LinePos?];
      const pair: [t.LinePos, t.LinePos] = b ? [a, b] : [a, a];
      return { ...base, linePos: pair };
    }
    if (Array.isArray(d.pos)) return { ...base, pos: d.pos };
    if (Array.isArray(d.range)) return { ...base, range: d.range as D['range'] };

    return { ...base } as D; // NB: no positional data; renderer will ignore this diagnostic.
  },
} as const;

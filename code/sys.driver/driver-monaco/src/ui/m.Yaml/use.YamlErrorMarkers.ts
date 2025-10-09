import React from 'react';
import { useErrorMarkers } from '../m.Markers.Error/mod.ts';
import { type t, slug, Yaml } from './common.ts';

type D = t.Diagnostic;

/**
 * Synchronize Monaco markers from YAML diagnostics or raw parser errors.
 * - Accepts mixed inputs (Yaml.Diagnostic | Yaml.Error) and normalizes per-item.
 * - Single-tuple `linePos` is normalized to a pair so a marker is always visible.
 * - The projector handles precedence: range > pos > linePos.
 */
export const useYamlErrorMarkers: t.UseYamlErrorMarkers = (args) => {
  const { errors = [], owner, ...rest } = args;
  const ownerRef = React.useRef(owner ?? `yaml-${slug()}`);

  // Normalize inputs → standard YAML diagnostics:
  const diagnostics = React.useMemo<t.Yaml.Diagnostic[]>(() => {
    return (errors ?? []).map(wrangle.asYamlDiagnostic).filter((x): x is t.Yaml.Diagnostic => !!x);
  }, [errors]);

  // Map YAML diagnostics → driver diagnostics for Monaco projector:
  const driverDiagnostics = React.useMemo<D[]>(
    () => diagnostics.map(wrangle.asEditorDiagnostic),
    [diagnostics],
  );

  return useErrorMarkers({
    ...rest,
    owner: ownerRef.current,
    errors: driverDiagnostics,
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

  asEditorDiagnostic(d: t.Yaml.Diagnostic): t.Diagnostic {
    const base = { message: d.message, code: d.code, path: d.path } as const;

    if (Array.isArray(d.linePos) && d.linePos.length > 0) {
      const [a, b] = d.linePos as readonly [t.LinePos, t.LinePos?];
      const pair: [t.LinePos, t.LinePos] = b ? [a, b] : [a, a];
      return { ...base, linePos: pair };
    }
    if (Array.isArray(d.pos)) return { ...base, pos: d.pos };
    if (Array.isArray(d.range)) return { ...base, range: d.range as D['range'] };

    return { ...base } as D; // no coords → projector will skip
  },
} as const;

import { useMemo, useRef } from 'react';

import { type t } from './common.ts';
import { useSlugSemanticDiagnostics } from './use.Slug.SemanticDiagnostics.ts';
import { useSlugStructuralDiagnostics } from './use.Slug.StructuralDiagnostics.ts';

export const useSlugDiagnostics: t.UseSlugDiagnostics = (registry, path, yaml) => {
  const structural = useSlugStructuralDiagnostics({ yaml, path });
  const semantic = useSlugSemanticDiagnostics({ registry, path, yaml });

  /**
   * Derive change keys from stable fingerprint:
   */
  const toKey = (d: readonly t.Yaml.Diagnostic[]) => d.map(fingerprintOf).sort().join('||');
  const structuralKey = useMemo(() => toKey(structural.diagnostics), [structural.diagnostics]);
  const semanticKey = useMemo(() => toKey(semantic.diagnostics), [semantic.diagnostics]);
  const key = `${structuralKey}#${semanticKey}`;

  /**
   * Monotonic `rev` - increments only when content changes.
   */
  const keyRef = useRef<string | undefined>(undefined);
  const revRef = useRef(0);
  if (keyRef.current !== key) {
    keyRef.current = key;
    revRef.current += 1;
  }
  const rev = revRef.current;

  /**
   * Stable diagnostics object.
   */
  const diagnostics = useMemo<readonly t.Yaml.Diagnostic[]>(
    () => toDiagnostics(structural.diagnostics, semantic.diagnostics),
    [key],
  );

  /**
   * API:
   */
  return {
    rev,
    diagnostics,
    sources: { structural, semantic },
  };
};

/**
 * Helpers:
 */
const fingerprintOf = (d: t.Yaml.Diagnostic): string => {
  const code = d.code ?? '';
  const path = d.path ? (Array.isArray(d.path) ? d.path.join('/') : String(d.path)) : '';
  const [start = '', end = ''] = Array.isArray(d.range) ? d.range : [];
  return `${code}|${path}|${start}|${end}`;
};

function toDiagnostics(
  structural: readonly t.Yaml.Diagnostic[],
  semantic: readonly t.Yaml.Diagnostic[],
): readonly t.Yaml.Diagnostic[] {
  const seen = new Set<string>();
  const out: t.Yaml.Diagnostic[] = [];
  for (const d of [...structural, ...semantic]) {
    const fp = fingerprintOf(d);
    if (seen.has(fp)) continue;
    seen.add(fp);
    out.push(d);
  }
  return out;
}

export const __test = {
  fingerprintOf,
  toDiagnostics,
  toKey: (d: readonly t.Yaml.Diagnostic[]) => d.map(fingerprintOf).sort().join('||'),
};

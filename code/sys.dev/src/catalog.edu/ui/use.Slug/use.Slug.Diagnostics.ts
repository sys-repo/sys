import { useMemo } from 'react';

import { type t } from './common.ts';
import { useSlugSemanticDiagnostics } from './use.Slug.SemanticDiagnostics.ts';
import { useSlugStructuralDiagnostics } from './use.Slug.StructuralDiagnostics.ts';

export const useSlugDiagnostics: t.UseSlugDiagnostics = (registry, path, yaml) => {
  const structural = useSlugStructuralDiagnostics({ yaml, path });
  const semantic = useSlugSemanticDiagnostics({ registry, path, yaml });

  // Merged list (stable by inputs):
  const diagnostics = useMemo(
    () => [...structural.diagnostics, ...semantic.diagnostics],
    [structural.diagnostics, semantic.diagnostics],
  );

  // Prefer the semantic/structural rev if provided, else yaml.rev fallback:
  const rev = semantic.rev ?? structural.rev ?? yaml?.rev ?? 0;

  // API:
  return {
    rev,
    diagnostics,
    sources: { structural, semantic },
  };
};

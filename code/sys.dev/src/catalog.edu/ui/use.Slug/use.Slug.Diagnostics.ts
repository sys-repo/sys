import { useMemo } from 'react';

import { type t } from './common.ts';
import { useSlugSemanticDiagnostics } from './use.Slug.SemanticDiagnostics.ts';
import { useSlugStructuralDiagnostics } from './use.Slug.StructuralDiagnostics.ts';

export const useSlugDiagnostics: t.UseSlugDiagnostics = (args) => {
  const structural = useSlugStructuralDiagnostics({ yaml: args.yaml, path: args.path });
  const semantic = useSlugSemanticDiagnostics({
    yaml: args.yaml,
    path: args.path,
    registry: args.registry,
  });

  // Merged list (stable by inputs):
  const diagnostics = useMemo(
    () => [...structural.diagnostics, ...semantic.diagnostics],
    [structural.diagnostics, semantic.diagnostics],
  );

  // Prefer the semantic/structural rev if provided, else yaml.rev fallback:
  const rev = semantic.rev ?? structural.rev ?? args.yaml?.rev ?? 0;

  // API:
  return {
    rev,
    diagnostics,
    structural,
    semantic,
  };
};

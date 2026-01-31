import { DocLintFacets as Facets } from './common.ts';
import { lintAliases } from './u.lint.aliases.ts';
import { lintSequenceFilepaths } from './u.lint.seq.files.ts';
import { lintTypedYamlSequence } from './u.lint.seq.TypedYamlSequence.ts';
import { cmd } from './u.Linter.cmd.ts';
import { run } from './u.Linter.run.ts';

/**
 * Lint namespace.
 */
export const Linter = {
  run,
  cmd,
  Facets,
  Facet: { lintAliases, lintSequenceFilepaths, lintTypedYamlSequence },
} as const;

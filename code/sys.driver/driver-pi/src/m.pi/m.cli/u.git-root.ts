import type { t } from './common.ts';

export const GIT_ROOT_MODES = ['walk-up', 'cwd'] as const;

export function parseGitRootMode(input?: string): t.PiCli.GitRootMode | undefined {
  if (!input) return;
  if ((GIT_ROOT_MODES as readonly string[]).includes(input)) return input as t.PiCli.GitRootMode;
  throw new Error(
    `Unsupported --git-root value: ${input}. Expected one of: ${GIT_ROOT_MODES.join(', ')}`,
  );
}

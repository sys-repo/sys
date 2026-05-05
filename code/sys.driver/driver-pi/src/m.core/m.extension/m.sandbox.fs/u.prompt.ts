import { Str, type t } from './common.ts';

/** Convert enabled remove-tool policy into Pi prompt args. */
export function toPromptArgs(policy: t.PiSandboxFsExtension.Policy) {
  if (!policy.enabled) return [] as const;
  return ['--append-system-prompt', formatPrompt(policy)] as const;
}

/**
 * Helpers:
 */
function formatPrompt(policy: t.PiSandboxFsExtension.Policy) {
  const recursive = policy.recursive
    ? 'Recursive removal is enabled by the active Pi profile.'
    : 'Recursive removal is disabled by the active Pi profile.';

  return Str.dedent(
    `
    # Runtime Tool Contract: remove

    The launcher has enabled the wrapper-owned \`remove\` tool.

    Available additional tool:
    - remove: Remove a file or directory path inside the writable sandbox. No globs, no shell commands.

    Rules:
    - Use \`remove\` for stale files or directories that should no longer exist after a refactor.
    - Do not use \`bash\` for file deletion or cleanup.
    - ${recursive}
    - The tool refuses protected control/runtime paths even when the process can write them.
    `,
  ).trim();
}

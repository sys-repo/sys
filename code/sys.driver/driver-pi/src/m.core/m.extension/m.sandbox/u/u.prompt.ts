import { Is, Str, type t } from '../common.ts';

/** Convert enabled sandbox filesystem tool policy into Pi prompt args. */
export function toPromptArgs(policy: t.PiSandboxFsExtension.Policy) {
  const prompt = formatPrompt(policy);
  if (!prompt) return [] as const;
  return ['--append-system-prompt', prompt] as const;
}

/**
 * Helpers:
 */
function formatPrompt(policy: t.PiSandboxFsExtension.Policy) {
  const sections = [
    policy.remove.enabled ? formatRemovePrompt(policy) : undefined,
    policy.move.enabled ? formatMovePrompt() : undefined,
    policy.copy.enabled ? formatCopyPrompt() : undefined,
  ].filter(Is.string);

  return sections.length > 0 ? sections.join('\n\n') : undefined;
}

function formatRemovePrompt(policy: t.PiSandboxFsExtension.Policy) {
  const recursive = policy.remove.recursive
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
    - Bash is not a file deletion or cleanup fallback. Do not use \`bash\`, \`rm\`, \`rmdir\`, \`unlink\`, shell redirection, heredocs, or ad hoc scripts to delete files/directories.
    - If asked to delete and the callable \`remove\` tool is unavailable, STOP and report a launcher/tooling fault. Do not fall back to \`bash\`.
    - ${recursive}
    - The tool refuses protected control/runtime paths even when the process can write them.
    `,
  ).trim();
}

function formatMovePrompt() {
  return Str.dedent(
    `
    # Runtime Tool Contract: move

    The launcher has enabled the wrapper-owned \`move\` tool.

    Available additional tool:
    - move: Move or rename a file or directory path inside the writable sandbox. No globs, no shell commands.

    Rules:
    - Use \`move\` for file/directory renames and refactor moves that should preserve content exactly.
    - Bash is not a file move/rename fallback. Do not use \`bash\`, \`mv\`, shell redirection, heredocs, or ad hoc scripts to move/rename files/directories.
    - If asked to move/rename and the callable \`move\` tool is unavailable, STOP and report a launcher/tooling fault. Do not fall back to \`bash\`.
    - The source must exist inside a writable sandbox root.
    - The destination must be inside a writable sandbox root.
    - The destination must not already exist.
    - The destination parent must already exist.
    - The tool refuses protected control/runtime paths even when the process can write them.
    `,
  ).trim();
}

function formatCopyPrompt() {
  return Str.dedent(
    `
    # Runtime Tool Contract: copy

    The launcher has enabled the wrapper-owned \`copy\` tool.

    Available additional tool:
    - copy: Copy one regular file from a readable sandbox path to a writable sandbox path. No globs, no shell commands.

    Rules:
    - Use \`copy\` for exact artifact import, such as copying a screenshot into the workspace before creating a note that references it.
    - Bash is not a file copy fallback. Do not use \`bash\`, \`cp\`, shell redirection, heredocs, or ad hoc scripts to copy files.
    - If asked to copy/import and the callable \`copy\` tool is unavailable, STOP and report a launcher/tooling fault. Do not fall back to \`bash\`.
    - The source must exist inside a readable sandbox root.
    - The source must be a regular file, not a directory or symlink.
    - The destination must be inside a writable sandbox root.
    - The destination must not already exist.
    - The destination parent must already exist.
    - The tool refuses protected control/runtime paths even when the process can read or write them.
    `,
  ).trim();
}

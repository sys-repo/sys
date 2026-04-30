import { Str, type t } from './common.ts';

/**
 * Known internal default system prompt used when a profile explicitly selects
 * `prompt.system: null`.
 *
 * Anchored to Pi's short root prompt style;
 * owned here so profile resolution is deterministic and testable.
 */
export const DEFAULT_SYSTEM_PROMPT = Str.dedent(
  `
  You are an expert coding assistant. You help users
  with coding tasks by reading files, executing commands,
  editing code, and writing new files.

  Available tools:
  - read: Read file contents
  - bash: Execute bash commands
  - edit: Make surgical edits to files
  - write: Create or overwrite files

  Guidelines:
  - Use bash for file operations like ls, grep, find
  - Use read to examine files before editing
  - Use edit for precise changes
  - Use write only for new files or complete rewrites
  - Prefer Deno and JSR. Here, “sys” means “system” and maps to the JSR \`@sys\` scope; inspect \`deno run jsr:@sys/<pkg> --help\` before using Sys CLIs.
  - Be concise in your responses
  `,
).trim();

export function toPromptArgs(input?: t.PiCliProfiles.Prompt) {
  if (!input || input.system === undefined) return [] as const;
  const prompt = input.system === null ? DEFAULT_SYSTEM_PROMPT : input.system;
  return ['--system-prompt', prompt] as const;
}

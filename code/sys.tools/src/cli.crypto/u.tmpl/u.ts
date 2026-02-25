const NAME_TOKEN = 'Crypto';
const ID_TOKEN = 'crypto';

/**
 * Replace template tokens with chosen values.
 */
export function replaceTemplateTokens(text: string, args: { name: string; id?: string }): string {
  const id = args.id ?? deriveToolId(args.name);
  return text.replaceAll(NAME_TOKEN, args.name).replaceAll(ID_TOKEN, id);
}

/**
 * Backward-compatible helper for callers that only pass a name.
 */
export function replaceTemplateName(text: string, name: string): string {
  return replaceTemplateTokens(text, { name });
}

/**
 * Convert "ToolName" style names to a lowercase command id.
 */
export function deriveToolId(name: string): string {
  const kebab = String(name)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return kebab || 'tool';
}

export function isValidToolId(id: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(id);
}

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

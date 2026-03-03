const NAME_TOKEN = 'Tmpl';
const ID_TOKEN = 'tmpl';
export { deriveToolId, isValidToolId } from './u.toolId.ts';
import { deriveToolId } from './u.toolId.ts';

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

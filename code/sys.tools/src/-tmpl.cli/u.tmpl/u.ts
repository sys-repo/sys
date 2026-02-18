const NAME_TOKEN = '__NAME__';

/**
 * Replace "__NAME__" template tokens with the chosen tool name.
 */
export function replaceTemplateName(text: string, name: string): string {
  return text.replaceAll(NAME_TOKEN, name);
}

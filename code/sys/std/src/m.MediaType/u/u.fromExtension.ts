import { type t, typeByExtension } from '../common.ts';

export const fromExtension: t.MediaType.Resolve.FromExtension = (extension, options) => {
  if (options?.profile === 'source') {
    const sourceType = fromSourceExtension(extension);
    if (sourceType) return sourceType;
  }
  return typeByExtension(extension);
};

/**
 * Helpers:
 */

function fromSourceExtension(extension: string): t.StringMimeType | undefined {
  const normalized = (extension.startsWith('.') ? extension.slice(1) : extension).toLowerCase();
  if (normalized === 'ts' || normalized === 'mts' || normalized === 'cts') {
    return 'application/typescript';
  }
  if (normalized === 'tsx') return 'application/typescript+jsx';
  return undefined;
}

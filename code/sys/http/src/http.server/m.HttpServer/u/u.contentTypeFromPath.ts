import { MediaType } from '@sys/std/media-type';

/** Resolve one canonical HTTP Content-Type from an admitted file path. */
export function contentTypeFromPath(path: string): string {
  const mediaType = MediaType.fromPath(path) ?? MediaType.Fallback.binary;
  return MediaType.toContentType(mediaType) ?? mediaType;
}

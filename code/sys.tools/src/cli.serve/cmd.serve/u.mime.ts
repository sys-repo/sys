import { type t } from '../common.ts';

export const Mime = {
  images: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/x-icon'],
  videos: ['video/webm', 'video/mp4'],
  documents: ['application/pdf', 'application/json', 'application/yaml'],
  code: ['application/javascript', 'application/wasm'],
  text: ['text/plain', 'text/html'],

  get groups(): Record<t.MimeGroup, readonly t.MimeType[]> {
    return {
      images: Mime.images,
      videos: Mime.videos,
      documents: Mime.documents,
      code: Mime.code,
      text: Mime.text,
    };
  },

  get extensionMap(): Record<string, t.MimeType> {
    const ext: Record<t.MimeType, readonly string[]> = {
      // Images
      'image/png': ['png'],
      'image/jpeg': ['jpg', 'jpeg'],
      'image/webp': ['webp'],
      'image/svg+xml': ['svg'],
      'image/x-icon': ['ico'],

      // Video
      'video/webm': ['webm'],
      'video/mp4': ['mp4'],

      // Documents
      'application/pdf': ['pdf'],
      'application/json': ['json'],
      'application/yaml': ['yaml', 'yml'],

      // Text & HTML
      'text/plain': ['txt'],
      'text/html': ['html', 'htm'],

      // JS & WASM
      'application/javascript': ['js', 'mjs'],
      'application/wasm': ['wasm'],
    };

    const entries = Object.entries(ext);
    return Object.fromEntries(
      entries.flatMap(([mime, exts]) => exts.map((ext) => [ext, mime])),
    ) as Record<string, t.MimeType>;
  },
} as const;

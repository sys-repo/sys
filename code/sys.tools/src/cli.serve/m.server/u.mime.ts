import { type t } from '../common.ts';

export const Mime = {
  fallback: 'application/octet-stream' as const,

  get extensionMap(): Record<string, t.ServeTool.MimeType> {
    const ext: Record<t.ServeTool.MimeType, readonly string[]> = {
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

      // Text & HTML & CSS
      'text/plain': ['txt'],
      'text/html': ['html', 'htm'],
      'text/css': ['css'],

      // JS & WASM
      'application/javascript': ['js', 'mjs'],
      'application/wasm': ['wasm'],
    };

    return Object.fromEntries(
      Object.entries(ext).flatMap(([mime, exts]) => exts.map((ext) => [ext, mime])),
    ) as Record<string, t.ServeTool.MimeType>;
  },
} as const;

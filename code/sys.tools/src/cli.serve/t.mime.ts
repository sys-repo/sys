export type MimeGroup = 'images' | 'videos' | 'documents' | 'code' | 'text';

/**
 * Explicit allow-list of MIME types supported by the system.
 *
 * Encodes policy (what we serve), not capability (what exists).
 * Used for validation, routing, and safety boundaries.
 */
export type MimeType =
  /** Text / docs: */
  | 'text/plain'
  | 'text/html'
  | 'text/css'
  | 'application/json'
  | 'application/pdf'
  | 'application/yaml'

  /** JS / WASM: */
  | 'application/javascript'
  | 'application/wasm'

  /** Images: */
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/svg+xml'
  | 'image/x-icon'

  /** Video: */
  | 'video/webm'
  | 'video/mp4';

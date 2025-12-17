/**
 * Constants:
 *   Canonical default excludes for filesystem walking/indexing.
 *   Keep this list small, safe, and broadly applicable across @sys/tools.
 */
export const EXCLUDE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/.DS_Store',

  // Secrets (.env):
  '**/.env',
  '**/.env.*',
] as const;

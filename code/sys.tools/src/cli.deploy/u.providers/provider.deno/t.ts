/**
 * Deno Deploy provider configuration (YAML configuration).
 */
export type DenoProvider = {
  kind: 'deno';

  /** Target Deno Deploy app name. */
  app: string;

  /** Optional Deno Deploy org. */
  org?: string;

  /** Optional env var name holding the deploy token. */
  tokenEnv?: string;

  /** When true, verify the preview URL after deploy. */
  verifyPreview?: boolean;
};

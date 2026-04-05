import { c, type t } from './common.ts';

export const Fmt = {
  error(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return `${c.red('Error:')} ${message}`;
  },

  validationErrors(errors: readonly t.ValueError[]): string {
    return errors
      .slice(0, 3)
      .map((error) => {
        const path = error.path || '<root>';
        return `${path}: ${error.message}`;
      })
      .join('; ');
  },
} as const;

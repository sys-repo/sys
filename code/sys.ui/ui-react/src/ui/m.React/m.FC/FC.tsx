import type { t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * Helpers for working with `React.FC` (aka. "functional components").
 */
export const FC: t.FCLib = {
  /**
   * Decorate a React function declaration with additional fields.
   */
  decorate<P, F extends O>(
    View: React.FC<P>,
    fields: F,
    options: { displayName?: string } = {},
  ): React.FC<P> & F {
    const { displayName } = options;
    if (displayName) View.displayName = displayName;
    Object.keys(fields).forEach((key) => ((View as any)[key] = fields[key]));
    return View as React.FC<P> & F;
  },
};

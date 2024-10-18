/**
 * @module
 * Commonly used React types.
 */
export type { FC } from 'react';

type O = Record<string, unknown>;

/**
 * Helpers for working with `React.FC` (aka. "functional components").
 */
export type FCLib = {
  /**
   * Decorate a React function declaration with additional fields.
   */
  decorate<P, F extends O>(
    View: React.FC<P>,
    fields: F,
    options?: { displayName?: string },
  ): React.FC<P> & F;
};

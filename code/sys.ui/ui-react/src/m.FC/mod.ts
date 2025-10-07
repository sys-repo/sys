/**
 * Functional-Component tools.
 * @module
 *
 * @example
 * ```ts
 * type Fields = {
 *   DEFAULTS: typeof DEFAULTS;
 * };
 * export const Component = FC.decorate<ComponentProps, Fields>(
 *   View,
 *   { DEFAULTS },
 *   { displayName: DEFAULTS.displayName },
 *  );
 *```
 */
export { FC } from './FC.tsx';

/**
 * @module
 * Package identity and compatibility exports for the UI DevHarness package.
 */
export { pkg } from './pkg.ts';

/** Backward-compatible root runtime surface. Prefer `@sys/ui-react-devharness/react`. */
export * from './m.react/mod.ts';

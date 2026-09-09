/**
 * @module
 * Installs ECMAScript disposal protocol symbols before client module bodies evaluate.
 *
 * The plugin injects the canonical `@sys/std/dispose/compat` side-effect import across Vite's
 * transformed client graph while excluding that entrypoint's bootstrap closure.
 */
export { DisposeProtocolCompatPlugin } from './m.DisposeProtocolCompatPlugin.ts';

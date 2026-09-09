/**
 * @module
 * Explicit server-side DOM emulation for tests.
 *
 * Importing does not install DOM globals; `DomMock.init` registers lifecycle hooks and
 * `DomMock.polyfill` installs process-global DOM state.
 */
export { DomMock } from '../m.Testing.DomMock/mod.ts';

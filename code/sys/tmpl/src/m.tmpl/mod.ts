/**
 * @module
 * Index of common file-system templates for "system".
 */
export { cli } from './u.cli.ts';

/**
 * Command-line:
 */
if (import.meta.main) {
  const { entry } = await import('./-entry.ts');
  await entry();
}

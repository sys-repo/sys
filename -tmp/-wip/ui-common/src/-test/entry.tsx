import { pkg } from '../common.ts';

/**
 * Render UI.
 */
globalThis.document.title = pkg.name;
console.log('🐷 entry.tsx', pkg);

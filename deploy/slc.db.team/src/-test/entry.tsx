import { pkg } from '../common.ts';

/**
 * Render UI.
 */
const document = globalThis.document;
document.title = pkg.name;
console.log('🐷 entry.tsx', pkg);

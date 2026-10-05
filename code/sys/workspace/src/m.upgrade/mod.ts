/**
 * Inspect published versions, plan dependency upgrades, and write them from one manifest.
 *
 * Collection and planning leave dependency files unchanged. Application computes a fresh plan
 * and writes the manifest, Deno imports, and any requested package.json dependencies and overrides.
 * Publication-age eligibility is separate from version policy; a visible release may be withheld.
 *
 * @module
 */
export { WorkspaceUpgrade } from './m.Upgrade.ts';

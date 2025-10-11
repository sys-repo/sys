import { pkg, Pkg } from '../common.ts';

export { Crdt } from '@sys/driver-automerge/web/ui';
export { Monaco } from '@sys/driver-monaco';

export { YamlPipeline } from '../../m.yaml/mod.ts';
export { useSlugStructuralDiagnostics } from '../use.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const name = 'catalog.edu.sample';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.name}` };

import { pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { EditorYaml } from '../m.Yaml/mod.ts';
export { EditorFolding } from '../m.Folding/mod.ts';

/**
 * Constants:
 */
const name = 'CodeEditor.Crdt';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const D = DEFAULTS;

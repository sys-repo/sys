import { pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { EditorFolding } from '../m.Crdt.Folding/mod.ts';
export { EditorYaml } from '../m.Yaml/mod.ts';

/**
 * Constants:
 */
const name = 'CodeEditor.Crdt';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const D = DEFAULTS;

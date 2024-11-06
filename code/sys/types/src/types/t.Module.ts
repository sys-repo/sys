/**
 * Represents an imported module.
 */
export type ModuleImport<T = unknown> = Promise<T>;

/**
 * A function that imports a module of type <T>.
 */
export type ModuleImporter<T = unknown> = () => ModuleImport<T>;

/**
 * A map of module imports.
 */
export type ModuleImports<T = unknown> = { [typename: string]: ModuleImporter<T> };

export type * from './ext.ts';

export type * from './t.Dispose.ts';
export type * from './t.Immutable.ts';
export type * from './t.Json.ts';
export type * from './t.Number.ts';
export type * from './t.Object.ts';
export type * from './t.Observable.ts';
export type * from './t.Pkg.ts';
export type * from './t.Readonly.ts';
export type * from './t.String.ts';
export type * from './t.Theme.ts';
export type * from './t.Time.ts';

/**
 * Common
 */
export type Falsy = false | 0 | '' | null | undefined;

/**
 * A response value from a function that is not used by the function
 * (allows for artibrary return values signalling to the consumer
 * that whatever is returned will not be used.)
 */
export type IgnoredResponse = any | Promise<any>;

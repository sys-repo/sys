export type * from './ext.ts';

export type * from './t.Dispose.ts';
export type * from './t.Immutable.ts';
export type * from './t.Object.ts';
export type * from './t.Observable.ts';
export type * from './t.Pkg.ts';
export type * from './t.Readonly.ts';

/**
 * Strings
 */
export type StringContentType = string;
export type StringJwt = string;
export type StringHttpHeader = string;
export type StringHttpHeaderName = string;
export type StringUrl = string;
export type StringPath = string;
export type StringDirPath = string;
export type StringFilePath = string;

/**
 * Numbers
 */
export type Index = number;
export type PortNumber = number;
export type Pixels = number;
export type Percent = number; // 0..1 ← (0=0%, 1=100%)
export type PixelOrPercent = Pixels | Percent; // 0..1 = percent, >1 = pixels

/**
 * Time.
 */
export type Msecs = number;

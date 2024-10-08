export type * from './ext.ts';

export type * from './t.Dispose.ts';
export type * from './t.Immutable.ts';
export type * from './t.Object.ts';
export type * from './t.Observable.ts';
export type * from './t.Pkg.ts';
export type * from './t.Readonly.ts';
export type * from './t.Theme.ts';

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

/**
 * Strings
 */

/* A string that represents a MIME type (aka "Content-Type" header). */
export type StringContentType = string;

/* A string that represents a JWT token (RFC-7519) */
export type StringJwt = string;

/* A string that represents an HTTP header. */
export type StringHttpHeader = string;

/* String that represents an HTTP header name. */
export type StringHttpHeaderName = string;

/* String that represents a URL (uniform resource locator). */
export type StringUrl = string;

/* String that represents a URI (uniform resource indicator). */
export type StringUri = string;

/* String that represents a unique identifier. */
export type StringId = string;

/**
 * String that represents a `tx` (transaction identifier).
 */
export type StringTx = string;

/* String that represents a path to a resource (file etc.) */
export type StringPath = string;

/* String that represents a path to a file-system directory. */
export type StringDirPath = string;

/* that represents a path to a file-system file. */
export type StringFilePath = string;

/**
 * Numbers
 */

/* A number representing an 0-based index. */
export type Index = number;

/* A number representing a network port */
export type PortNumber = number;

/* A number representing screen pixels. */
export type Pixels = number;

/* Number representing a percentage: 0..1 ← (0=0%, 1=100%) */
export type Percent = number;

/* A pixel OR a percentage number: 0..1 = percent, >1 = pixels */
export type PixelOrPercent = Pixels | Percent; //

/**
 * Time.
 */

/* A number representing milliseconds. */
export type Msecs = number;

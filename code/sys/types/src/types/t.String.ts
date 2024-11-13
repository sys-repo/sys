/** A string that represents a MIME type (aka "Content-Type" header). */
export type StringContentType = string;

/** A string that represents a JWT token (RFC-7519) */
export type StringJwt = string;

/** A string that represents an HTTP header. */
export type StringHttpHeader = string;

/** String that represents an HTTP header name. */
export type StringHttpHeaderName = string;

/** String that represents a URI (uniform resource indicator). */
export type StringUri = string;

/** String that represents a URL (uniform resource locator). */
export type StringUrl = string;

/** String that represents a URL route (eg: '/foo/:bar') */
export type StringUrlRoute = string;

/** String that represents a unique identifier. */
export type StringId = string;

/** String that represents a <semver> (semantic version), eg "0.1.2". */
export type StringSemVer = string;

/** String that represents a `tx` (transaction identifier). */
export type StringTx = string;

/** String that represents a path to a resource (file etc.) */
export type StringPath = string;

/** String that represents a path to a file-system directory. */
export type StringDir = StringPath;

/** String that represents a path to a file-system file. */
export type StringFile = StringPath;

/** String that represents a cryptographic hash. */
export type StringHash = string;

/** String that represents a hexadeciman (such as a color, eg: "#293042") */
export type StringHex = string;

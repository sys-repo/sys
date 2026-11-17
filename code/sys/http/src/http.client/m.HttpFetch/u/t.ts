import type { HttpOperation } from '../../../u/t.ts';
import type { t } from '../common.ts';

/** Private validated policy snapshot; mutable caller inputs are not retained. */
export type ValidatedPolicy = {
  readonly maxBytes: t.NumberBytes;
  readonly timeout: t.Msecs;
  readonly maxRedirects: number;
  readonly progressInterval: t.Msecs;
  readonly sourceOrigins: ReadonlySet<string>;
  readonly credentialOrigins: ReadonlySet<string>;
};

/** Private invocation inputs; transport authority is supplied by the owning instance. */
export type InvokeFetchArgs<T> = {
  readonly contentType: t.StringContentType;
  readonly contentTypePolicy: t.HttpFetch.CreateOptions['contentTypePolicy'];
  readonly method: 'GET' | 'HEAD';
  readonly input: t.FetchInput;
  readonly init: t.HttpFetch.Init;
  readonly options: t.HttpFetch.Options;
  readonly policy?: ValidatedPolicy;
  readonly externalSignal: AbortSignal;
  readonly defaultHeaders: () => Headers;
  readonly decode: (bytes: Uint8Array<ArrayBuffer>, response: Response) => Promise<T>;
  readonly checksumSource: 'bytes' | 'value';
};

/** Private bounded invocation seam. */
export type InvokeFetch = <T>(args: InvokeFetchArgs<T>) => Promise<t.HttpFetch.Response<T>>;

/** Private checksum boundary, loaded only when verification is requested. */
export type VerifyChecksum = <T>(
  data: T | undefined,
  expected: t.StringHash,
  errors: t.ErrorCollection,
) => t.HttpFetch.ResponseChecksum;

/** Dependencies supplied to the private invocation owner. */
export type InvokeFetchDependencies = {
  readonly loadChecksum: () => Promise<{ readonly verifyChecksum: VerifyChecksum }>;
};

/** Dependencies supplied to the private instance owner. */
export type MakeFetchDependencies = {
  readonly invoke: InvokeFetch;
};

/** Request-local signal composition with best-effort, idempotent listener cleanup. */
export type SignalComposition = t.DisposableLike & {
  readonly signal: AbortSignal | undefined;
};

/** Fetch-owned policy classifications. */
export type FailureKind = t.HttpFetch.ResponsePolicy.FailureKind;

/** Structural shape only; the private runtime registry authenticates failure identity. */
export type NominalFailure = Error & {
  readonly policyFailure: FailureKind;
};

/** Private operation contract retaining the factory's cancellation-symbol identity. */
export type Operation<TCancelled extends symbol = symbol> =
  & HttpOperation<TCancelled | NominalFailure>
  & {
    fail(kind: FailureKind): never;
  };

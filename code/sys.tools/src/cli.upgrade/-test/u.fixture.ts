import type { Jsr, t } from '../../-test.ts';

type VersionsResponse = Awaited<ReturnType<typeof Jsr.Fetch.Pkg.versions>>;
type VersionsMetadata = Extract<VersionsResponse, { readonly ok: true }>['data'];
type VersionsMetadataInput =
  & Pick<VersionsMetadata, 'latest'>
  & Partial<Pick<VersionsMetadata, 'versions'>>;

/** Resolve one successful JSR package-metadata response. */
export function versionsSuccess(metadata: VersionsMetadataInput): Promise<VersionsResponse> {
  const url = 'https://jsr.io/@sys/tools/meta.json' as t.StringUrl;
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    requestedUrl: url,
    finalUrl: url,
    data: {
      scope: 'sys',
      name: 'tools',
      latest: metadata.latest,
      versions: { [metadata.latest]: {}, ...(metadata.versions ?? {}) },
    },
    error: undefined,
  });
}

/** Resolve a transport-success response whose metadata violates the registry contract. */
export function versionsMalformed(data: unknown): Promise<VersionsResponse> {
  const url = 'https://jsr.io/@sys/tools/meta.json' as t.StringUrl;
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    requestedUrl: url,
    finalUrl: url,
    data,
    error: undefined,
  } as unknown as VersionsResponse);
}

/** Resolve one bounded JSR package-metadata failure response. */
export function versionsFailure(
  status = 503,
  statusText = 'Service Unavailable',
): Promise<VersionsResponse> {
  const url = 'https://jsr.io/@sys/tools/meta.json' as t.StringUrl;
  return Promise.resolve({
    ok: false,
    status,
    statusText,
    headers: new Headers(),
    url,
    data: undefined,
    error: {
      name: 'HttpError',
      message: `HTTP/GET request failed: ${url}`,
      status,
      statusText,
      headers: {},
    },
  });
}

import { Is, type t } from '../common.ts';
import { invalidPath } from './u.error.ts';

/** Build a portable content ref for a static file entry. */
export function contentRef(args: {
  readonly file: t.Files.Entry.File;
  readonly baseUrl?: t.StringUrl;
}): t.Files.ContentRef {
  const { file, baseUrl } = args;
  const base = {
    path: file.path,
    ...(file.size === undefined ? {} : { size: file.size }),
    ...(file.mediaType === undefined ? {} : { mediaType: file.mediaType }),
  };

  if (Is.string(baseUrl) && baseUrl.length > 0) {
    return {
      ...base,
      kind: 'url',
      url: contentUrl(baseUrl, file.path),
      ...(file.hash === undefined ? {} : { hash: file.hash }),
    };
  }

  if (file.hash === undefined) {
    throw invalidPath(`Static file has no content hash: ${file.path}`);
  }
  return { ...base, kind: 'hash', hash: file.hash };
}

/**
 * Helpers:
 */
function contentUrl(baseUrl: t.StringUrl, path: t.Files.String.Path): t.StringUrl {
  try {
    const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    return new URL(encoded, base).href as t.StringUrl;
  } catch (_error) {
    throw invalidPath('Invalid static Files base URL');
  }
}

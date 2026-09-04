import { describe, expectTypeOf, it, type t } from '../../-test.ts';
import type * as TPublicFiles from '../t.ts';

const capabilities: t.Files.Capabilities = {
  list: true,
  stat: true,
  read: true,
  write: false,
  remove: false,
  watch: false,
  manifest: true,
};

const file: t.Files.Entry.File = {
  kind: 'file',
  path: 'docs/readme.md',
  mediaType: 'text/markdown',
};

describe('Files/t public contract', () => {
  it('keeps consumers on the single Files namespace', () => {
    const policy = { read: '**' } satisfies TPublicFiles.Files.Policy.Shape;
    const name: TPublicFiles.Files.Cmd.Name = 'files:list';

    expectTypeOf(policy).toMatchTypeOf<t.Files.Policy.Shape>();
    expectTypeOf(name).toMatchTypeOf<t.Files.Cmd.Name>();

    if (false) {
      // @ts-expect-error Sibling namespaces stay private; consumers use Files.Cmd.
      type NoPublicFilesCmd = TPublicFiles.FilesCmd;
    }
  });

  it('keeps content refs as Files-domain values, not host paths or generic fetch inputs', () => {
    const url = {
      kind: 'url',
      path: 'asset.txt',
      url: 'https://example.test/asset.txt',
    } satisfies t.Files.ContentRef.Url;
    const hash = {
      kind: 'hash',
      path: 'asset.txt',
      hash: 'sha256-asset',
    } satisfies t.Files.ContentRef.Hash;
    const ref = {
      kind: 'ref',
      path: 'asset.txt',
      ref: 'content:asset',
    } satisfies t.Files.ContentRef.Ref;

    type ResolverRef = Parameters<t.Files.ContentRef.Lib['text']>[0];
    const resolverRef: ResolverRef = url;

    expectTypeOf(url).toMatchTypeOf<t.Files.ContentRef>();
    expectTypeOf(hash).toMatchTypeOf<t.Files.ContentRef>();
    expectTypeOf(ref).toMatchTypeOf<t.Files.ContentRef>();
    expectTypeOf(resolverRef).toMatchTypeOf<t.Files.ContentRef>();

    if (false) {
      // @ts-expect-error URL refs require a URL.
      const missingUrl: t.Files.ContentRef = { kind: 'url', path: 'asset.txt' };

      // @ts-expect-error Hash refs require a hash.
      const missingHash: t.Files.ContentRef = { kind: 'hash', path: 'asset.txt' };

      const hostPathKind = { kind: 'path', path: 'asset.txt', ref: 'content:asset' } as const;

      // @ts-expect-error `path` is intentionally not a content-ref kind.
      const pathKind: t.Files.ContentRef = hostPathKind;

      const arbitraryUrl = 'https://example.test/asset.txt' as t.StringUrl;

      // @ts-expect-error ContentRef resolvers accept Files refs, not arbitrary URLs.
      const resolverUrl: ResolverRef = arbitraryUrl;

      // @ts-expect-error ContentRef resolvers accept Files refs, not Fetch Request objects.
      const resolverRequest: ResolverRef = new Request(arbitraryUrl);
    }
  });

  it('keeps cursor brands scoped at command boundaries', () => {
    const list: t.Files.Cursor.List = 'files:cursor:list:v1:page-1';
    const watch: t.Files.Cursor.Watch = 'files:cursor:watch:v1:seq-1';
    const manifest: t.Files.Cursor.Manifest = 'files:cursor:manifest:v1:page-1';

    const listPayload = { cursor: list } satisfies t.Files.Cmd.List.Payload;
    const listResult = { entries: [], cursor: list } satisfies t.Files.Cmd.List.Result;
    const watchResult = { ok: true, cursor: watch } satisfies t.Files.Cmd.Watch.Result;
    const manifestPayload = {
      cursor: manifest,
      contentRefs: true,
    } satisfies t.Files.Cmd.Manifest.Payload;
    const manifestResult = {
      '.meta': {
        version: 'sys.files.manifest:v1',
        capabilities,
        page: { cursor: manifest },
      },
      entries: [],
      contentRefs: [],
    } satisfies t.Files.Manifest;

    expectTypeOf(listPayload.cursor).toEqualTypeOf<t.Files.Cursor.List>();
    expectTypeOf(listResult.cursor).toEqualTypeOf<t.Files.Cursor.List>();
    expectTypeOf(watchResult.cursor).toEqualTypeOf<t.Files.Cursor.Watch>();
    expectTypeOf(manifestPayload.cursor).toEqualTypeOf<t.Files.Cursor.Manifest>();
    expectTypeOf(manifestResult['.meta'].page?.cursor).toEqualTypeOf<t.Files.Cursor.Manifest>();

    if (false) {
      const widened = 'files:cursor:list:v1:page-1' as string;
      const versionless = 'files:cursor:list:page-1';
      const unknownKind = 'files:cursor:read:v1:page-1';

      // @ts-expect-error Widened strings are not accepted as typed Files cursors.
      const wrongWidened: t.Files.Cursor.List = widened;

      // @ts-expect-error Cursor strings must include the version segment.
      const wrongVersion: t.Files.Cursor.List = versionless;

      // @ts-expect-error Cursor kinds are limited to list/watch/manifest.
      const wrongKind: t.Files.String.Cursor = unknownKind;

      // @ts-expect-error List cursors must not be accepted as manifest cursors.
      const wrongScope: t.Files.Cursor.Manifest = list;

      // @ts-expect-error List payloads accept only list cursors.
      const badListPayload: t.Files.Cmd.List.Payload = { cursor: manifest };

      // @ts-expect-error Watch results accept only watch cursors.
      const badWatchResult: t.Files.Cmd.Watch.Result = { ok: true, cursor: list };

      // @ts-expect-error Manifest payloads accept only manifest cursors.
      const badManifestPayload: t.Files.Cmd.Manifest.Payload = { cursor: list };

      // @ts-expect-error Manifest payloads ask for content refs, not content.
      const badManifestContentPayload: t.Files.Cmd.Manifest.Payload = { content: true };

      // @ts-expect-error Manifests expose content refs, not content.
      const badManifestContentResult: t.Files.Manifest = { ...manifestResult, content: [] };

      const badManifestResult: t.Files.Manifest = {
        ...manifestResult,
        '.meta': {
          ...manifestResult['.meta'],
          page: {
            // @ts-expect-error Manifests expose only manifest cursors.
            cursor: list,
          },
        },
      };
    }
  });

  it('keeps read results mutually exclusive by kind', () => {
    const inline = {
      kind: 'inline',
      file,
      encoding: 'utf8',
      content: '# Readme',
    } satisfies t.Files.Cmd.Read.Result;
    const ref = {
      kind: 'ref',
      file,
      contentRef: { kind: 'hash', path: file.path, hash: 'sha256-readme' },
    } satisfies t.Files.Cmd.Read.Result;

    expectTypeOf(inline).toMatchTypeOf<t.Files.Cmd.Read.InlineResult>();
    expectTypeOf(ref).toMatchTypeOf<t.Files.Cmd.Read.RefResult>();

    if (false) {
      const inlineWithRef = {
        kind: 'inline',
        file,
        encoding: 'utf8',
        contentRef: { kind: 'hash', path: file.path, hash: 'sha256-readme' },
      } as const;
      const refWithContent = { kind: 'ref', file, content: '# Readme' } as const;

      // @ts-expect-error Inline read results carry content, not content refs.
      const badInline: t.Files.Cmd.Read.InlineResult = inlineWithRef;

      // @ts-expect-error Ref read results carry content refs, not inline content.
      const badRef: t.Files.Cmd.Read.RefResult = refWithContent;
    }
  });

  it('keeps backing error names on the canonical Files suffix set', () => {
    const fs = 'FilesFsError.InvalidPath' satisfies t.FilesFs.Error.Kind;
    const memory = 'FilesMemoryError.InvalidPath' satisfies t.FilesMemory.Error.Kind;

    void fs;
    void memory;

    if (false) {
      // @ts-expect-error Backing error suffixes must be canonical Files suffixes.
      const badFs: t.FilesFs.Error.Kind = 'FilesFsError.Bad';

      // @ts-expect-error Backing error prefixes are adapter-specific.
      const badMemory: t.FilesMemory.Error.Kind = 'FilesFsError.InvalidPath';
    }
  });

  it('binds handler maps to the Files Cmd event grammar', () => {
    const handlers = {
      'files:capabilities': () => capabilities,
      'files:list': (_payload, ctx) => {
        // @ts-expect-error List is unary; it has no streaming event payload.
        ctx.emit({ kind: 'modified', path: 'docs/readme.md' });
        return { entries: [] };
      },
      'files:stat': (payload) => ({ entry: { kind: 'file', path: payload.path } }),
      'files:read': (payload) => ({
        kind: 'ref',
        file: { kind: 'file', path: payload.path },
        contentRef: { kind: 'ref', path: payload.path, ref: 'content:1' },
      }),
      'files:write': (payload) => ({
        kind: 'created',
        path: payload.path,
        entry: { kind: 'file', path: payload.path },
      }),
      'files:remove': (payload) => ({ kind: 'deleted', path: payload.path }),
      'files:watch': (_payload, ctx) => {
        ctx.emit({ kind: 'modified', path: 'docs/readme.md' });

        // @ts-expect-error Watch emits full Files.Change payloads.
        ctx.emit({ path: 'docs/readme.md' });

        return { ok: true };
      },
      'files:manifest': () => ({
        '.meta': { version: 'sys.files.manifest:v1', capabilities },
        entries: [],
      }),
    } satisfies t.Files.Cmd.HandlerMap;

    const client = {} as t.Files.Cmd.Client;
    const unary = {} as t.Files.Cmd.UnaryClient;

    expectTypeOf(handlers).toMatchTypeOf<t.Files.Cmd.HandlerMap>();
    expectTypeOf(client).toEqualTypeOf<
      t.Cmd.Client.Handle<
        t.Files.Cmd.Name,
        t.Files.Cmd.Payload,
        t.Files.Cmd.Result,
        t.Files.Cmd.Event
      >
    >();
    expectTypeOf(unary).toEqualTypeOf<
      t.Cmd.Client.Unary<t.Files.Cmd.Name, t.Files.Cmd.Payload, t.Files.Cmd.Result>
    >();
  });
});

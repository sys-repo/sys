import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import type {
  Files as TFiles,
  FilesCmd as TFilesCmd,
  FilesCursor as TFilesCursor,
  FilesEntry as TFilesEntry,
  FilesError as TFilesError,
} from '@sys/model/files/t';

const capabilities: t.Files.Capabilities = {
  list: true,
  stat: true,
  read: true,
  watch: false,
  manifest: true,
};

const file: t.FilesEntry.File = {
  kind: 'file',
  path: 'docs/readme.md',
  mediaType: 'text/markdown',
};

describe('Files/t', () => {
  it('public type paths expose the same Files grammar', () => {
    const rootManifest = {} as t.Files.Manifest;
    const publicManifest = {} as TFiles.Manifest;
    const client = {} as t.Files.Client;

    expectTypeOf(rootManifest).toEqualTypeOf<TFiles.Manifest>();
    expectTypeOf(publicManifest).toEqualTypeOf<t.Files.Manifest>();
    expectTypeOf(client).toEqualTypeOf<t.FilesCmd.Client>();
    expectTypeOf({} as t.FilesCmd.Name).toEqualTypeOf<TFilesCmd.Name>();
    expectTypeOf({} as t.FilesCursor.Kind).toEqualTypeOf<TFilesCursor.Kind>();
    expectTypeOf({} as t.FilesEntry.Entry).toEqualTypeOf<TFilesEntry.Entry>();
  });

  it('content refs are discriminated handles, not host paths', () => {
    const url: TFiles.ContentRef = {
      kind: 'url',
      path: 'asset.txt',
      url: '/asset.txt',
    };
    const hash: TFiles.ContentRef = {
      kind: 'hash',
      path: 'asset.txt',
      hash: 'sha256-asset',
    };
    const ref: TFiles.ContentRef = {
      kind: 'ref',
      path: 'asset.txt',
      ref: 'content:asset',
    };

    expect([url.kind, hash.kind, ref.kind]).to.eql(['url', 'hash', 'ref']);

    // @ts-expect-error URL refs require a URL.
    const missingUrl: TFiles.ContentRef = { kind: 'url', path: 'asset.txt' };

    // @ts-expect-error Hash refs require a hash.
    const missingHash: TFiles.ContentRef = { kind: 'hash', path: 'asset.txt' };

    const hostPathKind = { kind: 'path', path: 'asset.txt', ref: 'content:asset' } as const;

    // @ts-expect-error `path` is intentionally not a content-ref kind.
    const pathKind: TFiles.ContentRef = hostPathKind;

    expect(missingUrl.kind).to.eql('url');
    expect(missingHash.kind).to.eql('hash');
    expect(pathKind.kind).to.eql('path');
  });

  it('cursor strings are versioned, scoped, and not plain strings', () => {
    const list: t.FilesCursor.List = 'files:cursor:list:v1:page-1';
    const watch: t.FilesCursor.Watch = 'files:cursor:watch:v1:seq-1';
    const manifest: t.FilesCursor.Manifest = 'files:cursor:manifest:v1:page-1';
    const generic: t.Files.StringCursor = manifest;

    expect(list).to.eql('files:cursor:list:v1:page-1');
    expect(watch).to.eql('files:cursor:watch:v1:seq-1');
    expect(manifest).to.eql('files:cursor:manifest:v1:page-1');
    expect(generic).to.eql(manifest);

    expectTypeOf(list).toEqualTypeOf<t.FilesCursor.List>();
    expectTypeOf(watch).toEqualTypeOf<t.FilesCursor.Watch>();
    expectTypeOf(manifest).toEqualTypeOf<t.FilesCursor.Manifest>();
    expectTypeOf(generic).toMatchTypeOf<t.Files.StringCursor>();

    const widened = 'files:cursor:list:v1:page-1' as string;
    const versionless = 'files:cursor:list:page-1';
    const unknownKind = 'files:cursor:read:v1:page-1';

    // @ts-expect-error Widened strings are not accepted as typed Files cursors.
    const wrongWidened: t.FilesCursor.List = widened;

    // @ts-expect-error Cursor strings must include the version segment.
    const wrongVersion: t.FilesCursor.List = versionless;

    // @ts-expect-error Cursor kinds are limited to list/watch/manifest.
    const wrongKind: t.Files.StringCursor = unknownKind;

    // @ts-expect-error List cursors must not be accepted as manifest cursors.
    const wrongScope: t.FilesCursor.Manifest = list;

    expect(wrongWidened).to.eql(widened);
    expect(wrongVersion).to.eql(versionless);
    expect(wrongKind).to.eql(unknownKind);
    expect(wrongScope).to.eql(list);
  });

  it('command cursor slots preserve their scope', () => {
    const list: t.FilesCursor.List = 'files:cursor:list:v1:page-1';
    const watch: t.FilesCursor.Watch = 'files:cursor:watch:v1:seq-1';
    const manifest: t.FilesCursor.Manifest = 'files:cursor:manifest:v1:page-1';

    const listPayload: t.FilesCmd.List.Payload = { cursor: list };
    const listResult: t.FilesCmd.List.Result = { entries: [], cursor: list };
    const watchResult: t.FilesCmd.Watch.Result = { ok: true, cursor: watch };
    const manifestPayload: t.FilesCmd.Manifest.Payload = { cursor: manifest };
    const manifestResult: t.Files.Manifest = {
      version: 'sys.files.manifest.v1',
      capabilities,
      entries: [],
      cursor: manifest,
    };

    expect(listPayload.cursor).to.eql(list);
    expect(listResult.cursor).to.eql(list);
    expect(watchResult.cursor).to.eql(watch);
    expect(manifestPayload.cursor).to.eql(manifest);
    expect(manifestResult.cursor).to.eql(manifest);

    const wrongListSlot = { cursor: manifest };
    const wrongWatchSlot = { ok: true, cursor: list };
    const wrongManifestSlot = { cursor: list };
    const wrongManifestResult = {
      version: 'sys.files.manifest.v1' as const,
      capabilities,
      entries: [],
      cursor: list,
    };

    // @ts-expect-error List payloads accept only list cursors.
    const badListPayload: t.FilesCmd.List.Payload = wrongListSlot;

    // @ts-expect-error Watch results accept only watch cursors.
    const badWatchResult: t.FilesCmd.Watch.Result = wrongWatchSlot;

    // @ts-expect-error Manifest payloads accept only manifest cursors.
    const badManifestPayload: t.FilesCmd.Manifest.Payload = wrongManifestSlot;

    // @ts-expect-error Manifests expose only manifest cursors.
    const badManifestResult: t.Files.Manifest = wrongManifestResult;

    expect(badListPayload.cursor).to.eql(manifest);
    expect(badWatchResult.cursor).to.eql(list);
    expect(badManifestPayload.cursor).to.eql(list);
    expect(badManifestResult.cursor).to.eql(list);
  });

  it('read results discriminate inline content from content refs', () => {
    const inline: t.FilesCmd.Read.Result = {
      kind: 'inline',
      file,
      encoding: 'utf8',
      content: '# Readme',
    };
    const ref: t.FilesCmd.Read.Result = {
      kind: 'ref',
      file,
      contentRef: { kind: 'hash', path: file.path, hash: 'sha256-readme' },
    };

    const read = (input: t.FilesCmd.Read.Result) => {
      if (input.kind === 'inline') {
        expectTypeOf(input.content).toEqualTypeOf<string>();
        return input.content;
      }

      expectTypeOf(input.contentRef).toMatchTypeOf<t.Files.ContentRef>();
      return input.contentRef.kind;
    };

    expect(read(inline)).to.eql('# Readme');
    expect(read(ref)).to.eql('hash');

    const inlineWithRef = {
      kind: 'inline',
      file,
      encoding: 'utf8',
      contentRef: { kind: 'hash', path: file.path, hash: 'sha256-readme' },
    } as const;
    const refWithContent = { kind: 'ref', file, content: '# Readme' } as const;

    // @ts-expect-error Inline read results carry content, not content refs.
    const badInline: t.FilesCmd.Read.InlineResult = inlineWithRef;

    // @ts-expect-error Ref read results carry content refs, not inline content.
    const badRef: t.FilesCmd.Read.RefResult = refWithContent;

    expect(badInline.kind).to.eql('inline');
    expect(badRef.kind).to.eql('ref');
  });

  it('backing error kinds share the canonical Files error suffix set', () => {
    type FsSuffix = t.FilesFs.Error.Kind extends `FilesFsError.${infer S}` ? S : never;
    type MemorySuffix = t.FilesMemory.Error.Kind extends `FilesMemoryError.${infer S}` ? S : never;

    const fs: t.FilesFs.Error.Kind = 'FilesFsError.InvalidPath';
    const memory: t.FilesMemory.Error.Kind = 'FilesMemoryError.InvalidPath';

    expectTypeOf({} as FsSuffix).toEqualTypeOf<t.FilesError.KindSuffix>();
    expectTypeOf({} as MemorySuffix).toEqualTypeOf<TFilesError.KindSuffix>();
    expect(fs).to.eql('FilesFsError.InvalidPath');
    expect(memory).to.eql('FilesMemoryError.InvalidPath');

    // @ts-expect-error Backing error suffixes must be canonical Files suffixes.
    const badFs: t.FilesFs.Error.Kind = 'FilesFsError.Bad';

    // @ts-expect-error Backing error prefixes are adapter-specific.
    const badMemory: t.FilesMemory.Error.Kind = 'FilesFsError.InvalidPath';

    expect(badFs).to.eql('FilesFsError.Bad');
    expect(badMemory).to.eql('FilesFsError.InvalidPath');
  });

  it('handlers and clients bind to first-class Cmd contracts', () => {
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
      'files:watch': (_payload, ctx) => {
        ctx.emit({ kind: 'modified', path: 'docs/readme.md' });

        // @ts-expect-error Watch emits full Files.Change payloads.
        ctx.emit({ path: 'docs/readme.md' });

        return { ok: true };
      },
      'files:manifest': () => ({
        version: 'sys.files.manifest.v1',
        capabilities,
        entries: [],
      }),
    } satisfies t.FilesCmd.HandlerMap;

    const client = {} as t.FilesCmd.Client;
    const unary = {} as t.FilesCmd.UnaryClient;

    expectTypeOf(handlers).toMatchTypeOf<t.FilesCmd.HandlerMap>();
    expectTypeOf(client).toMatchTypeOf<
      t.Cmd.Client.Handle<
        t.FilesCmd.Name,
        t.FilesCmd.Payload,
        t.FilesCmd.Result,
        t.FilesCmd.Event
      >
    >();
    expectTypeOf(unary).toMatchTypeOf<
      t.Cmd.Client.Unary<t.FilesCmd.Name, t.FilesCmd.Payload, t.FilesCmd.Result>
    >();
  });
});

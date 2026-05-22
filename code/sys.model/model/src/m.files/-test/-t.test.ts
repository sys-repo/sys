import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
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

describe('Files/t', () => {
  it('publishes Files as the public type namespace', () => {
    const policy = { read: '**' } satisfies TPublicFiles.Files.Policy.Shape;
    const name = 'files:list' as TPublicFiles.Files.Cmd.Name;

    // @ts-expect-error Sibling namespaces stay private; consumers use Files.Cmd.
    type NoPublicFilesCmd = TPublicFiles.FilesCmd;

    expect(policy.read).to.eql('**');
    expectTypeOf(name).toMatchTypeOf<string>();
  });

  it('content refs are discriminated handles, not host paths', () => {
    const url: t.Files.ContentRef = {
      kind: 'url',
      path: 'asset.txt',
      url: '/asset.txt',
    };
    const hash: t.Files.ContentRef = {
      kind: 'hash',
      path: 'asset.txt',
      hash: 'sha256-asset',
    };
    const ref: t.Files.ContentRef = {
      kind: 'ref',
      path: 'asset.txt',
      ref: 'content:asset',
    };

    expect([url.kind, hash.kind, ref.kind]).to.eql(['url', 'hash', 'ref']);

    // @ts-expect-error URL refs require a URL.
    const missingUrl: t.Files.ContentRef = { kind: 'url', path: 'asset.txt' };

    // @ts-expect-error Hash refs require a hash.
    const missingHash: t.Files.ContentRef = { kind: 'hash', path: 'asset.txt' };

    const hostPathKind = { kind: 'path', path: 'asset.txt', ref: 'content:asset' } as const;

    // @ts-expect-error `path` is intentionally not a content-ref kind.
    const pathKind: t.Files.ContentRef = hostPathKind;

    expect(missingUrl.kind).to.eql('url');
    expect(missingHash.kind).to.eql('hash');
    expect(pathKind.kind).to.eql('path');
  });

  it('cursor strings are versioned, scoped, and not plain strings', () => {
    const list: t.Files.Cursor.List = 'files:cursor:list:v1:page-1';
    const watch: t.Files.Cursor.Watch = 'files:cursor:watch:v1:seq-1';
    const manifest: t.Files.Cursor.Manifest = 'files:cursor:manifest:v1:page-1';
    const generic: t.Files.String.Cursor = manifest;

    expect(list).to.eql('files:cursor:list:v1:page-1');
    expect(watch).to.eql('files:cursor:watch:v1:seq-1');
    expect(manifest).to.eql('files:cursor:manifest:v1:page-1');
    expect(generic).to.eql(manifest);

    expectTypeOf(list).toEqualTypeOf<t.Files.Cursor.List>();
    expectTypeOf(watch).toEqualTypeOf<t.Files.Cursor.Watch>();
    expectTypeOf(manifest).toEqualTypeOf<t.Files.Cursor.Manifest>();
    expectTypeOf(generic).toMatchTypeOf<t.Files.String.Cursor>();

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

    expect(wrongWidened).to.eql(widened);
    expect(wrongVersion).to.eql(versionless);
    expect(wrongKind).to.eql(unknownKind);
    expect(wrongScope).to.eql(list);
  });

  it('command cursor slots preserve their scope', () => {
    const list: t.Files.Cursor.List = 'files:cursor:list:v1:page-1';
    const watch: t.Files.Cursor.Watch = 'files:cursor:watch:v1:seq-1';
    const manifest: t.Files.Cursor.Manifest = 'files:cursor:manifest:v1:page-1';

    const listPayload: t.Files.Cmd.List.Payload = { cursor: list };
    const listResult: t.Files.Cmd.List.Result = { entries: [], cursor: list };
    const watchResult: t.Files.Cmd.Watch.Result = { ok: true, cursor: watch };
    const manifestPayload: t.Files.Cmd.Manifest.Payload = { cursor: manifest };
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
    const badListPayload: t.Files.Cmd.List.Payload = wrongListSlot;

    // @ts-expect-error Watch results accept only watch cursors.
    const badWatchResult: t.Files.Cmd.Watch.Result = wrongWatchSlot;

    // @ts-expect-error Manifest payloads accept only manifest cursors.
    const badManifestPayload: t.Files.Cmd.Manifest.Payload = wrongManifestSlot;

    // @ts-expect-error Manifests expose only manifest cursors.
    const badManifestResult: t.Files.Manifest = wrongManifestResult;

    expect(badListPayload.cursor).to.eql(manifest);
    expect(badWatchResult.cursor).to.eql(list);
    expect(badManifestPayload.cursor).to.eql(list);
    expect(badManifestResult.cursor).to.eql(list);
  });

  it('read results discriminate inline content from content refs', () => {
    const inline: t.Files.Cmd.Read.Result = {
      kind: 'inline',
      file,
      encoding: 'utf8',
      content: '# Readme',
    };
    const ref: t.Files.Cmd.Read.Result = {
      kind: 'ref',
      file,
      contentRef: { kind: 'hash', path: file.path, hash: 'sha256-readme' },
    };

    const read = (input: t.Files.Cmd.Read.Result) => {
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
    const badInline: t.Files.Cmd.Read.InlineResult = inlineWithRef;

    // @ts-expect-error Ref read results carry content refs, not inline content.
    const badRef: t.Files.Cmd.Read.RefResult = refWithContent;

    expect(badInline.kind).to.eql('inline');
    expect(badRef.kind).to.eql('ref');
  });

  it('backing error kinds share the canonical Files error suffix set', () => {
    const fs: t.FilesFs.Error.Kind = 'FilesFsError.InvalidPath';
    const memory: t.FilesMemory.Error.Kind = 'FilesMemoryError.InvalidPath';

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
        version: 'sys.files.manifest.v1',
        capabilities,
        entries: [],
      }),
    } satisfies t.Files.Cmd.HandlerMap;

    const client = {} as t.Files.Cmd.Client;
    const unary = {} as t.Files.Cmd.UnaryClient;

    expectTypeOf(handlers).toMatchTypeOf<t.Files.Cmd.HandlerMap>();
    expectTypeOf(client).toMatchTypeOf<
      t.Cmd.Client.Handle<
        t.Files.Cmd.Name,
        t.Files.Cmd.Payload,
        t.Files.Cmd.Result,
        t.Files.Cmd.Event
      >
    >();
    expectTypeOf(unary).toMatchTypeOf<
      t.Cmd.Client.Unary<t.Files.Cmd.Name, t.Files.Cmd.Payload, t.Files.Cmd.Result>
    >();
  });
});

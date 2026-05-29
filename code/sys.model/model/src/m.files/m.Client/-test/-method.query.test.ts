import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { createTransport } from './u.fixture.ts';

const capabilities: t.Files.Capabilities = {
  list: true,
  stat: true,
  read: true,
  write: false,
  remove: false,
  watch: true,
  manifest: true,
  fidelity: 'snapshot',
  encodings: ['utf8'],
};

const entry: t.Files.Entry = {
  path: 'docs/readme.md',
  kind: 'file',
  size: 4,
  mediaType: 'text/markdown',
};

describe('Files.Client.Handle query surface', () => {
  it('delegates humane query methods to the typed Files Cmd grammar', async () => {
    const seen = {
      list: [] as t.Files.Cmd.List.Payload[],
      stat: [] as t.Files.Cmd.Stat.Payload[],
      manifest: [] as t.Files.Cmd.Manifest.Payload[],
      watch: [] as t.Files.Cmd.Watch.Payload[],
    };
    const unsupported = () => {
      throw new Error('Unsupported test command');
    };
    const setup = createTransport({
      'files:capabilities': () => capabilities,
      'files:list': (payload) => {
        seen.list.push(payload);
        return { entries: [entry] };
      },
      'files:stat': (payload) => {
        seen.stat.push(payload);
        return { entry };
      },
      'files:read': unsupported,
      'files:write': unsupported,
      'files:remove': unsupported,
      'files:watch': (payload) => {
        seen.watch.push(payload);
        return { ok: true, cursor: 'files:cursor:watch:v1:2' as t.Files.Cursor.Watch };
      },
      'files:manifest': (payload) => {
        seen.manifest.push(payload);
        const manifest: t.Files.Manifest = {
          '.meta': { version: 'sys.files.manifest:v1', capabilities },
          entries: [entry],
          ...(payload.contentRefs === true ? { contentRefs: [] } : {}),
        };
        return manifest;
      },
    });

    try {
      expect(await setup.files.capabilities()).to.eql(capabilities);
      expect(await setup.files.list({ path: 'docs', depth: 1 })).to.eql({ entries: [entry] });
      expect(await setup.files.stat('docs/readme.md')).to.eql(entry);
      expect(await setup.files.manifest()).to.eql({
        '.meta': { version: 'sys.files.manifest:v1', capabilities },
        entries: [entry],
      });
      expect(await setup.files.manifest({ contentRefs: true })).to.eql({
        '.meta': { version: 'sys.files.manifest:v1', capabilities },
        entries: [entry],
        contentRefs: [],
      });

      const watch = setup.files.watch({ path: 'docs', since: 1 as t.Files.Seq });
      expect(await watch.done).to.eql({
        ok: true,
        cursor: 'files:cursor:watch:v1:2',
      });

      expect(seen.list).to.eql([{ path: 'docs', depth: 1 }]);
      expect(seen.stat).to.eql([{ path: 'docs/readme.md' }]);
      expect(seen.manifest).to.eql([{}, { contentRefs: true }]);
      expect(seen.watch).to.eql([{ path: 'docs', since: 1 }]);
    } finally {
      setup.dispose();
    }
  });

  it('keeps client method result types truthful', async () => {
    if (false) {
      const handle = undefined as unknown as t.Files.Client.Handle;

      const caps = await handle.capabilities();
      expectTypeOf(caps).toEqualTypeOf<t.Files.Capabilities>();

      const list = await handle.list({ depth: 1 });
      expectTypeOf(list).toEqualTypeOf<t.Files.Cmd.List.Result>();

      const stat = await handle.stat('docs/readme.md');
      expectTypeOf(stat).toEqualTypeOf<t.Files.Entry>();

      const manifest = await handle.manifest();
      expectTypeOf(manifest).toEqualTypeOf<t.Files.Manifest>();

      const withRefs = await handle.manifest({ contentRefs: true });
      expectTypeOf(withRefs.contentRefs).toEqualTypeOf<readonly t.Files.ContentRef[]>();

      const watch = handle.watch();
      expectTypeOf(watch).toEqualTypeOf<t.Files.Client.Watch>();

      // @ts-expect-error Humane manifest options ask for content refs, not content.
      handle.manifest({ content: true });
    }
  });
});

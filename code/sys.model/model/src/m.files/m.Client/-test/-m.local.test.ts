import { describe, expect, it } from '../../../-test.ts';
import { FilesMemory } from '../../../m.files.memory/mod.ts';
import { Files } from '../../mod.ts';
import { Client } from '../mod.ts';

describe('Files.Client.local', () => {
  it('binds an in-process backing to the readText handle facade', async () => {
    const backing = FilesMemory.Readonly.create({
      files: { 'hello.txt': 'Hello from local Files\n' },
      policy: Files.Policy.readonly('**'),
    });
    const files = Client.local(backing);

    try {
      expect(Object.keys(files).sort()).to.eql([
        'capabilities',
        'cmd',
        'dispose',
        'dispose$',
        'disposed',
        'list',
        'manifest',
        'readText',
        'remove',
        'stat',
        'watch',
        'writeBytes',
        'writeText',
      ]);
      expect(await files.readText('hello.txt')).to.eql('Hello from local Files\n');
      const result = await files.cmd.send(Files.Cmd.Name.read, { path: 'hello.txt' });
      expect(result.kind).to.eql('inline');
      if (result.kind === 'inline') expect(result.content).to.eql('Hello from local Files\n');
    } finally {
      files.dispose('test-cleanup');
      files.dispose('test-cleanup-again');
      expect(files.disposed).to.eql(true);
    }
  });

  it('mutates a real memory backing through write and remove methods', async () => {
    const backing = FilesMemory.Writable.create({
      dirs: ['docs', 'assets'],
      policy: {
        list: '**',
        stat: '**',
        read: '**',
        write: '**',
        remove: '**',
        watch: '**',
        manifest: true,
      },
    });
    const files = Client.local(backing);

    try {
      expect(await files.writeText('docs/readme.md', '# Hello\n', {
        mediaType: 'text/markdown',
      })).to.eql({
        kind: 'created',
        path: 'docs/readme.md',
        entry: { path: 'docs/readme.md', kind: 'file', size: 8, mediaType: 'text/markdown' },
      });
      expect(await files.readText('docs/readme.md')).to.eql('# Hello\n');
      expect(await files.stat('docs/readme.md')).to.eql({
        path: 'docs/readme.md',
        kind: 'file',
        size: 8,
        mediaType: 'text/markdown',
      });

      expect(await files.writeBytes('assets/app.wasm', new Uint8Array([0, 1, 2, 255]), {
        mediaType: 'application/wasm',
      })).to.eql({
        kind: 'created',
        path: 'assets/app.wasm',
        entry: { path: 'assets/app.wasm', kind: 'file', size: 4, mediaType: 'application/wasm' },
      });
      expect(await files.stat('assets/app.wasm')).to.eql({
        path: 'assets/app.wasm',
        kind: 'file',
        size: 4,
        mediaType: 'application/wasm',
      });
      expect(await files.list({ path: 'assets' })).to.eql({
        entries: [
          { path: 'assets/app.wasm', kind: 'file', size: 4, mediaType: 'application/wasm' },
        ],
      });

      expect(await files.remove('docs/readme.md')).to.eql({
        kind: 'deleted',
        path: 'docs/readme.md',
      });
      expect(await files.list({ path: 'docs' })).to.eql({ entries: [] });
    } finally {
      files.dispose('test-cleanup');
    }
  });
});

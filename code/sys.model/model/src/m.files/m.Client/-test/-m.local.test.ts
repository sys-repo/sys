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
        'stat',
        'watch',
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
});

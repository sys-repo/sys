import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { FilesMemory } from '../../../m.files.memory/mod.ts';
import { Files } from '../../mod.ts';
import { createTransport } from './u.fixture.ts';

describe('Files.Client.transport', () => {
  it('returns a small readText handle with raw cmd escape hatch', async () => {
    const backing = FilesMemory.Readonly.create({
      files: { 'app.yaml': 'name: app\n' },
      policy: Files.Policy.readonly('**'),
    });
    const setup = createTransport(backing.handlers);

    try {
      const files = setup.files;
      expect(Object.keys(files).sort()).to.eql([
        'cmd',
        'dispose',
        'dispose$',
        'disposed',
        'readText',
      ]);
      expect('read' in files).to.eql(false);
      expect('send' in files).to.eql(false);
      expect('stream' in files).to.eql(false);
      expect(typeof files.readText).to.eql('function');
      expect(typeof files.cmd.send).to.eql('function');
      expect(typeof files.cmd.stream).to.eql('function');
      expectTypeOf(files).toEqualTypeOf<t.Files.Client.Transport>();

      expect(await files.readText('app.yaml')).to.eql('name: app\n');
      const result = await files.cmd.send(Files.Cmd.Name.read, { path: 'app.yaml' });
      expect(result.kind).to.eql('inline');
    } finally {
      setup.dispose();
      expect(setup.files.disposed).to.eql(true);
    }
  });
});

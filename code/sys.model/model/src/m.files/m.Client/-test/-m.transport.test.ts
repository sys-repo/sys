import { describe, expect, it } from '../../../-test.ts';
import { FilesMemory } from '../../../m.files.memory/mod.ts';
import { Files } from '../../mod.ts';
import { createTransport } from './u.fixture.ts';

describe('Files.Client.transport', () => {
  it('binds a generic Cmd<T> endpoint to the Files<T> client facade', async () => {
    const backing = FilesMemory.Readonly.create({
      files: { 'app.yaml': 'name: app\n' },
      policy: Files.Policy.readonly('**'),
    });
    const binding = createTransport(backing.handlers);

    try {
      expect(await binding.files.readText('app.yaml')).to.eql('name: app\n');

      const result = await binding.files.cmd.send(Files.Cmd.Name.read, { path: 'app.yaml' });
      expect(result).to.include({ kind: 'inline', content: 'name: app\n' });
    } finally {
      binding.dispose();
      expect(binding.files.disposed).to.eql(true);
    }
  });
});

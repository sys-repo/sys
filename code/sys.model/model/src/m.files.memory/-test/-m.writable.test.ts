import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { FilesMemory } from '../mod.ts';
import { allowAllMutablePolicy, cmd, expectFilesMemoryError } from './u.fixture.ts';

describe('FilesMemory.writable', () => {
  it('creates a bounded writable backing without live diagnostics', async () => {
    const backing = FilesMemory.writable({ policy: allowAllMutablePolicy, maxReadBytes: 64 });

    expect(backing.kind).to.eql('files/memory:writable');
    expect(Object.isFrozen(backing.policy)).to.eql(true);
    expect(Object.isFrozen(backing.capabilities)).to.eql(true);
    expect(Object.isFrozen(backing.handlers)).to.eql(true);
    expect(backing).to.not.have.property('diagnostics');
    expect(backing).to.not.have.property('root');
    expect(backing).to.not.have.property('files');
    expectTypeOf(backing).toEqualTypeOf<t.FilesMemory.Writable>();
    expect(await cmd.capabilities(backing)).to.eql({
      list: true,
      stat: true,
      read: true,
      write: true,
      remove: true,
      watch: false,
      manifest: true,
      fidelity: 'dynamic',
      maxReadBytes: 64,
      encodings: ['utf8'],
    });
    await expectFilesMemoryError(
      () => cmd.watch(backing, { path: '' }),
      'FilesMemoryError.Unsupported',
    );
  });
});

import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Files } from '../../m.files/mod.ts';
import { FilesMemory } from '../mod.ts';
import { allowAllMutablePolicy, cmd, expectFilesMemoryError } from './u.fixture.ts';

const WRITABLE_SUPPORTS = {
  list: true,
  stat: true,
  read: true,
  write: true,
  remove: true,
  manifest: true,
} satisfies Partial<t.Files.Capability.Map>;

describe('FilesMemory.Writable.create', () => {
  it('creates a bounded writable backing without live diagnostics', async () => {
    const backing = FilesMemory.Writable.create({
      policy: allowAllMutablePolicy,
      maxReadBytes: 64,
    });

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

  it('derives writable capability truth from Files.Authority', async () => {
    const backing = FilesMemory.Writable.create({
      policy: allowAllMutablePolicy,
      maxReadBytes: 64,
    });
    const authority = Files.Authority.resolve({
      policy: backing.policy,
      backing: {
        supports: WRITABLE_SUPPORTS,
        fidelity: 'dynamic',
        maxReadBytes: 64,
        encodings: ['utf8'],
      },
    });

    expect(backing.capabilities).to.eql(authority.capabilities);
    expect(await cmd.capabilities(backing)).to.eql(authority.capabilities);

    const manifest = await cmd.manifest(backing);
    expect(manifest['.meta'].capabilities).to.eql(authority.capabilities);
  });
});

import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Cmd } from '../m.Cmd.ts';
import { Files } from '../mod.ts';

describe('Files.Cmd', () => {
  it('API', () => {
    expect(Files.Cmd).to.equal(Cmd);
    expect(Cmd.ns).to.eql('sys.files');
    expect(Cmd.Name).to.eql({
      capabilities: 'files:capabilities',
      list: 'files:list',
      stat: 'files:stat',
      read: 'files:read',
      watch: 'files:watch',
      manifest: 'files:manifest',
    });

    expectTypeOf(Cmd).toEqualTypeOf<t.Files.Cmd.Lib>();
    expectTypeOf(Cmd.Name.list).toEqualTypeOf<t.Files.Cmd.Name.List>();
  });
});

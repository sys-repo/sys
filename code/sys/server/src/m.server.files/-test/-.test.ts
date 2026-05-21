import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { FilesServer } from '../mod.ts';

describe('@sys/server/files', () => {
  it('API', async () => {
    const m = await import('@sys/server/files');

    expect(m.FilesServer).to.equal(FilesServer);
    expect(Object.keys(FilesServer).sort()).to.eql(['WebSocket']);
    expect(Object.keys(FilesServer.WebSocket).sort()).to.eql(['create', 'start']);
    expectTypeOf(FilesServer).toMatchTypeOf<t.FilesServer.Lib>();
  });
});

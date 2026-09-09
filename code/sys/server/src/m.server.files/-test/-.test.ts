import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { FilesServer } from '../mod.ts';

describe('@sys/server/files', () => {
  it('API', async () => {
    const m = await import('@sys/server/files');

    expect(m.FilesServer).to.equal(FilesServer);
    expect(Object.keys(FilesServer).sort()).to.eql(['Http', 'WebSocket']);
    expect(Object.keys(FilesServer.Http).sort()).to.eql(['manifest']);
    expect(Object.keys(FilesServer.WebSocket).sort()).to.eql(['create', 'start']);
    expect(Object.isFrozen(FilesServer)).to.eql(true);
    expect(Object.isFrozen(FilesServer.Http)).to.eql(true);
    expect(Object.isFrozen(FilesServer.WebSocket)).to.eql(true);
    expectTypeOf(FilesServer).toMatchTypeOf<t.FilesServer.Lib>();
  });
});

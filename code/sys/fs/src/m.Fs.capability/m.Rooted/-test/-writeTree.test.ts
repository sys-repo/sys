import {
  chunks,
  describe,
  directoryTarget,
  expect,
  expectFailure,
  expectTypeOf,
  Fs,
  it,
  OPTIONS,
  setup,
  type t,
  teardown,
  treeFile,
} from './u.fixture.writer.ts';

describe('Fs.Capability.Rooted stage writer', () => {
  it('constructs privately → closes → promotes the complete tree exactly once', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await directoryTarget(rooted, 'result');
      const stage = await rooted.Stage.create();
      expectTypeOf(stage.writer).toEqualTypeOf<t.FsRooted.StageWriter>();
      expect(Object.keys(stage)).to.eql(['path', 'files', 'writer']);
      expect(Object.keys(stage.writer)).to.eql(['writeTree']);
      expect(Object.isFrozen(stage.writer)).to.eql(true);
      const write = stage.writer.writeTree;
      await write([
        treeFile(chunks(new Uint8Array([1]), new Uint8Array([2, 3])), 3, 'dir/a'),
        { kind: 'directory', path: 'dir' },
        treeFile(chunks(), 0, 'empty'),
      ], OPTIONS);
      expect(await Fs.exists(Fs.join(rooted.path, 'result'))).to.eql(false);
      expect(await Deno.readFile(Fs.join(stage.path, 'dir/a'))).to.eql(new Uint8Array([1, 2, 3]));
      await expectFailure(() => write([], OPTIONS), 'invalid-state');
      await expectFailure(() => stage.files.Target.admit([]), 'invalid-state');
      expect(await rooted.Stage.promote(stage, target)).to.eql({ kind: 'published' });
      expect(await Deno.readFile(Fs.join(rooted.path, 'result/dir/a'))).to.eql(
        new Uint8Array([1, 2, 3]),
      );
      await rooted.Stage.discard(stage);
    } finally {
      await teardown(fixture);
    }
  });
});

import {
  act,
  describe,
  DomMock,
  expect,
  it,
  MonacoFake,
  renderHook,
  Rx,
  Time,
} from '../../../-test.ts';
import { type t, Bus, Crdt } from '../common.ts';
import { EditorYaml } from '../mod.ts';

describe('Monaco.Yaml', () => {
  DomMock.polyfill();

  it('API', async () => {
    const m = await import('@sys/driver-monaco');
    expect(m.Monaco.Yaml).to.eql(EditorYaml);
    expect(m.Monaco.Yaml.Path.observe).to.equal(EditorYaml.Path.observe);
  });

  describe('Monaco.Yaml (ping/pong)', () => {
    it('responds to editor:ping with editor:yaml + editor:pong', async () => {
      const bus$ = Bus.make();
      const monaco = MonacoFake.monaco({ cast: true });
      const model = MonacoFake.model('foo: bar', { language: 'yaml' });
      const editor = MonacoFake.editor(model);

      type T = { foo?: string };
      const repo = await Crdt.repo().whenReady();
      const doc = repo.create<T>({ foo: 'bar' });

      const { result, unmount } = renderHook(() =>
        EditorYaml.useYaml({ bus$, doc, path: ['text'], editor, monaco }),
      );

      const life = Rx.disposable();
      const events: t.EditorEvent[] = [];
      bus$.pipe(Rx.takeUntil(life.dispose$)).subscribe((e) => events.push(e));

      const nonce = 'nonce-123';
      act(() => {
        Bus.ping(bus$, ['yaml'], nonce);
      });

      await Time.wait(10);

      const yaml = events.find((e) => e.kind === 'editor:yaml') as t.EventYaml;
      const pong = events.find((e) => e.kind === 'editor:pong') as t.EventEditorPong;

      expect(yaml).to.exist;
      expect(pong).to.exist;
      expect(pong.nonce).to.equal(nonce);
      expect(pong.states).to.eql(['yaml']);
      expect(pong.at).to.be.a('number');

      await repo.dispose();
      life.dispose();
      unmount();
    });
  });
});

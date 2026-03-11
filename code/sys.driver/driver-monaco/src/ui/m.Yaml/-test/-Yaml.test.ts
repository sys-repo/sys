import {
  act,
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  it,
  Schedule,
  MonacoFake,
  renderHook,
  Rx,
} from '../../../-test.ts';
import { type t, Bus, Immutable } from '../common.ts';
import { EditorYaml } from '../mod.ts';
import { useYaml } from '../use.Yaml.ts';
import { useYamlErrorMarkers } from '../use.YamlErrorMarkers.ts';

const settle = async () => {
  await Schedule.micro();
  await Schedule.macro();
  await Schedule.raf();
  await Schedule.macro();
};

describe('Monaco.Yaml', () => {
  DomMock.init({ beforeAll, afterAll });

  it('API', async () => {
    const m = await import('@sys/driver-monaco');
    expect(m.Monaco.Yaml).to.eql(EditorYaml);
    expect(m.Monaco.Yaml.Path.observe).to.equal(EditorYaml.Path.observe);
    expect(m.Monaco.Yaml.useYaml).to.equal(useYaml);
    expect(m.Monaco.Yaml.useYamlErrorMarkers).to.equal(useYamlErrorMarkers);
  });

  describe('Monaco.Yaml (ping/pong)', () => {
    it('responds to editor:ping with editor:yaml + editor:pong', async () => {
      const bus$ = Bus.make();
      const monaco = MonacoFake.monaco({ cast: true });
      const model = MonacoFake.model('foo: bar', { language: 'yaml' });
      const editor = MonacoFake.editor(model);

      const doc = Immutable.clonerRef({ text: 'foo: bar' });

      const { result, unmount } = renderHook(() =>
        EditorYaml.useYaml({ bus$, doc, path: ['text'], editor, monaco, debounce: 0 }),
      );

      const life = Rx.disposable();
      const events: t.EditorEvent[] = [];
      bus$.pipe(Rx.takeUntil(life.dispose$)).subscribe((e) => events.push(e));

      const nonce = 'nonce-123';
      act(() => {
        Bus.ping(bus$, ['yaml'], nonce);
      });

      await settle();

      const yaml = events.find((e) => e.kind === 'editor:yaml') as t.EventYaml;
      const pong = events.find((e) => e.kind === 'editor:pong') as t.EventEditorPong;

      expect(yaml).to.exist;
      expect(pong).to.exist;
      expect(pong.nonce).to.equal(nonce);
      expect(pong.states).to.eql(['yaml']);
      expect(pong.at).to.be.a('number');

      life.dispose();
      unmount();

      await settle();
    });
  });
});

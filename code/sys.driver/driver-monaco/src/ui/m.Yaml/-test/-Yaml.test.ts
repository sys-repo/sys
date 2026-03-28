import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  MonacoFake,
  renderHook,
  Rx,
  settle,
} from '../../../-test.ts';
import { type t, Bus, Immutable } from '../common.ts';
import { EditorYaml } from '../mod.ts';
import { useYaml } from '../use.Yaml.ts';
import { useYamlErrorMarkers } from '../use.YamlErrorMarkers.ts';

describe('Monaco.Yaml', () => {
  DomMock.init({ beforeEach, afterEach });

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
      const sub = bus$.pipe(Rx.takeUntil(life.dispose$)).subscribe((e) => events.push(e));
      try {
        const nonce = 'nonce-123';
        await act(async () => {
          Bus.ping(bus$, ['yaml'], nonce);
          await settle();
        });

        const yaml = events.find((e) => e.kind === 'editor:yaml') as t.EventYaml;
        const pong = events.find((e) => e.kind === 'editor:pong') as t.EventEditorPong;

        expect(yaml).to.exist;
        expect(pong).to.exist;
        expect(pong.nonce).to.equal(nonce);
        expect(pong.states).to.eql(['yaml']);
        expect(pong.at).to.be.a('number');
      } finally {
        sub.unsubscribe();
        life.dispose();
        await act(async () => {
          unmount();
          await settle();
        });
      }
    });
  });
});

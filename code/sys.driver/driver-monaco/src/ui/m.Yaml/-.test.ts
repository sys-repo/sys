import { type t, describe, expect, it, MonacoFake, Rx, Schedule } from '../../-test.ts';
import { EditorYaml } from './mod.ts';

describe('Monaco.Yaml', () => {
  it('API', async () => {
    const m = await import('@sys/driver-monaco');
    expect(m.Monaco.Yaml).to.eql(EditorYaml);
    expect(m.Monaco.Yaml.Path.observe).to.equal(EditorYaml.Path.observe);
  });

  describe('lifecycle', () => {
    it('dispose: via method', () => {
      const editor = MonacoFake.editor('');
      const ob = EditorYaml.Path.observe({ editor });
      expect(ob.disposed).to.eql(false);
      ob.dispose();
      expect(ob.disposed).to.eql(true);
    });

    it('dispose: via dispose$', () => {
      const life = Rx.disposable();
      const editor = MonacoFake.editor('');
      const ob = EditorYaml.Path.observe({ editor }, life);
      expect(ob.disposed).to.eql(false);
      life.dispose();
      expect(ob.disposed).to.eql(true);
    });
  });

  describe('Yaml.Path.observe', () => {
    it('emits the expected path when the caret moves', async () => {
      const yaml = `
      foo: 👋
      bar:
        msg: hello
        count: 123
      `.slice(1);
      const model = MonacoFake.model(yaml, { language: 'yaml' });
      const editor = MonacoFake.editor(model);
      const ob = EditorYaml.Path.observe({ editor });

      const fired: t.EventYamlChangeCursorPath[] = [];
      ob.$.subscribe((e) => fired.push(e));

      // Caret inside the "👋" scalar.
      editor.setPosition({ lineNumber: 1, column: 6 }); // "👋"
      expect(ob.current?.path).to.eql(['foo']);

      await Schedule.macro();
      expect(fired.at(-1)?.path).to.eql(['foo']);
      expect(fired.at(-1)?.cursor).to.eql({ position: { lineNumber: 1, column: 6 }, offset: 6 });

      // Caret on "m" of "msg".
      editor.setPosition({ lineNumber: 3, column: 5 }); // Two-space indent + "m".
      expect(ob.current?.path).to.eql(['bar', 'msg']);

      // Caret on "c" of "count".
      editor.setPosition({ lineNumber: 4, column: 5 });
      expect(ob.current?.path).to.eql(['bar', 'count']);

      // Mutate buffer → re-parse; caret in new root key "baz".
      model.setValue(`${yaml}baz: 42`);
      editor.setPosition({ lineNumber: 5, column: 3 }); // "b" in "baz".
      expect(ob.current?.path).to.eql(['baz']);
    });

    it('only tracks YAML (reset on other languages)', async () => {
      const yaml = `foo: 👋`;
      const model = MonacoFake.model(yaml, { language: 'yaml' });
      const editor = MonacoFake.editor(model);
      const ob = EditorYaml.Path.observe({ editor });

      const fired: t.EventYamlChangeCursorPath[] = [];
      ob.$.subscribe((e) => fired.push(e));

      editor.setPosition({ lineNumber: 1, column: 6 });

      await Schedule.macro();
      expect(ob.current?.path).to.eql(['foo']);
      expect(fired.length).to.eql(1);

      model.__setLanguageId('typescript');
      expect(ob.current.path).to.eql([]);

      await Schedule.macro();
      expect(fired.length).to.eql(2);
      expect(fired.at(-1)?.path).to.eql([]);
      expect(fired.at(-1)?.cursor).to.eql(undefined);
    });

    describe('caret bias edge-cases', () => {
      it('resolves the correct root key when the file starts with a blank line', () => {
        const yaml = `\nfoo: 123\nbar:\n  baz: 456\n  zoo:\n    - one`;
        const model = MonacoFake.model(yaml, { language: 'yaml' });
        const editor = MonacoFake.editor(model);
        const ob = EditorYaml.Path.observe({ editor });

        // Caret on the “f” of the root key “foo:” (line-2, col-1 because of leading blank line).
        editor.setPosition({ lineNumber: 2, column: 1 });
        expect(ob.current?.path).to.eql(['foo']);

        // Caret on the “b” of the root key “bar:” (line-3, col-1).
        editor.setPosition({ lineNumber: 3, column: 1 });
        expect(ob.current?.path).to.eql(['bar']);
      });

      it('does not include the first child when caret is on a root key after a blank line', () => {
        const yaml = `.foo:\n  dev: true\n\nvideo:\n  src: https://example.com/video.mp4\n  crop: [11.5, -10]\n  width: 600`;
        const model = MonacoFake.model(yaml, { language: 'yaml' });
        const editor = MonacoFake.editor(model);
        const ob = EditorYaml.Path.observe({ editor });

        // Caret on “v” of “video:” (line-4, col-1).
        editor.setPosition({ lineNumber: 4, column: 1 });
        expect(ob.current?.path).to.eql(['video']);

        // Move caret into the “s” of “src” (line-5, two-space indent + “s”).
        editor.setPosition({ lineNumber: 5, column: 3 });
        expect(ob.current?.path).to.eql(['video', 'src']);
      });
    });
  });
});

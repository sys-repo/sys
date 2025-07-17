import { type t, describe, expect, it, MonacoFake, rx } from '../../-test.ts';
import { EditorYaml } from './mod.ts';

describe('Monaco.Yaml', () => {
  describe('Yaml.observePath', () => {
    it('emits the expected path when the caret moves', () => {
      const yaml = `
  foo: 👋
  bar:
    msg: hello
    count: 123
  `.slice(1);
      const model = MonacoFake.model(yaml, { language: 'yaml' });
      const editor = MonacoFake.editor(model);
      const ob = EditorYaml.observePath(editor);

      const fired: t.EditorYamlPathObserverEvent[] = [];
      ob.$.subscribe((e) => fired.push(e));

      // Caret inside the "👋" scalar.
      editor.setPosition({ lineNumber: 1, column: 6 }); // "👋"
      expect(ob.path).to.eql(['foo']);

      expect(fired.at(-1)?.path).to.eql(['foo']);
      expect(fired.at(-1)?.cursor).to.eql({ position: { lineNumber: 1, column: 6 }, offset: 5 });

      // Caret on "m" of "msg".
      editor.setPosition({ lineNumber: 3, column: 5 }); // Two-space indent + "m".
      expect(ob.path).to.eql(['bar', 'msg']);

      // Caret on "c" of "count".
      editor.setPosition({ lineNumber: 4, column: 5 });
      expect(ob.path).to.eql(['bar', 'count']);

      // Mutate buffer → re-parse; caret in new root key "baz".
      model.setValue(`${yaml}baz: 42`);
      editor.setPosition({ lineNumber: 5, column: 3 }); // "b" in "baz".
      expect(ob.path).to.eql(['baz']);
    });

    it('only tracks YAML (reset on other languages)', () => {
      const yaml = `foo: 👋`;
      const model = MonacoFake.model(yaml, { language: 'yaml' });
      const editor = MonacoFake.editor(model);
      const ob = EditorYaml.observePath(editor);

      const fired: t.EditorYamlPathObserverEvent[] = [];
      ob.$.subscribe((e) => fired.push(e));

      editor.setPosition({ lineNumber: 1, column: 6 });
      expect(ob.path).to.eql(['foo']);

      model.__setLanguageId('typescript');
      expect(ob.path).to.eql([]);

      expect(fired.length).to.eql(2);
      expect(fired.at(-1)?.path).to.eql([]);
      expect(fired.at(-1)?.cursor).to.eql({ offset: -1, position: { lineNumber: -1, column: -1 } });
    });

    describe('dispose', () => {
      it('via method', () => {
        const editor = MonacoFake.editor('');
        const tracker = EditorYaml.observePath(editor);
        expect(tracker.disposed).to.eql(false);
        tracker.dispose();
        expect(tracker.disposed).to.eql(true);
      });

      it('via dispose$', () => {
        const life = rx.disposable();
        const editor = MonacoFake.editor('');
        const tracker = EditorYaml.observePath(editor, life);
        expect(tracker.disposed).to.eql(false);
        life.dispose();
        expect(tracker.disposed).to.eql(true);
      });
    });
  });
});

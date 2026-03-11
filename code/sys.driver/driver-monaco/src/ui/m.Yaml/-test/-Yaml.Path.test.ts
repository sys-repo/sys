import { type t, describe, expect, it, MonacoFake, Rx, Schedule } from '../../../-test.ts';
import { Bus } from '../common.ts';
import { EditorYaml } from '../mod.ts';

describe('Monaco.Yaml', () => {
  describe('Yaml.Path', () => {
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

    describe('caret movement', () => {
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

        const fired: t.EventYamlCursor[] = [];
        const sub = ob.$.subscribe((e) => fired.push(e));
        try {
          // Caret inside the "👋" scalar.
          editor.setPosition({ lineNumber: 1, column: 6 }); // "👋"
          expect(ob.current?.path).to.eql(['foo']);

          await Schedule.macro();
          expect(fired.at(-1)?.path).to.eql(['foo']);
          expect(fired.at(-1)?.position).to.eql({ lineNumber: 1, column: 6 });
          expect(fired.at(-1)?.offset).to.eql(6);

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
        } finally {
          sub.unsubscribe();
          ob.dispose();
        }
      });

      it('only tracks YAML (reset on other languages)', async () => {
        const yaml = `foo: 👋`;
        const model = MonacoFake.model(yaml, { language: 'yaml' });
        const editor = MonacoFake.editor(model);
        const ob = EditorYaml.Path.observe({ editor });

        const fired: t.EventYamlCursor[] = [];
        const sub = ob.$.subscribe((e) => fired.push(e));
        try {
          editor.setPosition({ lineNumber: 1, column: 6 });

          await Schedule.macro();
          expect(ob.current?.path).to.eql(['foo']);
          expect(fired.length).to.eql(2);

          model.__setLanguageId('typescript');
          expect(ob.current.path).to.eql([]);

          await Schedule.macro();
          expect(fired.length).to.eql(3);
          expect(fired.at(-1)?.path).to.eql([]);
          expect(fired.at(-1)?.position).to.eql(undefined);
          expect(fired.at(-1)?.offset).to.eql(undefined);
        } finally {
          sub.unsubscribe();
          ob.dispose();
        }
      });

      describe('caret bias edge-cases', () => {
        it('resolves the correct root key when the file starts with a blank line', () => {
          const yaml = `\nfoo: 123\nbar:\n  baz: 456\n  zoo:\n    - one`;
          const model = MonacoFake.model(yaml, { language: 'yaml' });
          const editor = MonacoFake.editor(model);
          const ob = EditorYaml.Path.observe({ editor });
          try {
            // Caret on the “f” of the root key “foo:” (line-2, col-1 because of leading blank line).
            editor.setPosition({ lineNumber: 2, column: 1 });
            expect(ob.current?.path).to.eql(['foo']);

            // Caret on the “b” of the root key “bar:” (line-3, col-1).
            editor.setPosition({ lineNumber: 3, column: 1 });
            expect(ob.current?.path).to.eql(['bar']);
          } finally {
            ob.dispose();
          }
        });

        it('does not include the first child when caret is on a root key after a blank line', () => {
          const yaml = `.foo:\n  dev: true\n\nvideo:\n  src: https://example.com/video.mp4\n  crop: [11.5, -10]\n  width: 600`;
          const model = MonacoFake.model(yaml, { language: 'yaml' });
          const editor = MonacoFake.editor(model);
          const ob = EditorYaml.Path.observe({ editor });
          try {
            // Caret on “v” of “video:” (line-4, col-1).
            editor.setPosition({ lineNumber: 4, column: 1 });
            expect(ob.current?.path).to.eql(['video']);

            // Move caret into the “s” of “src” (line-5, two-space indent + “s”).
            editor.setPosition({ lineNumber: 5, column: 3 });
            expect(ob.current?.path).to.eql(['video', 'src']);
          } finally {
            ob.dispose();
          }
        });
      });
    });

    describe('singleton registry', () => {
      it('reuses the same producer for the same editorId', async () => {
        const model = MonacoFake.model('foo: 1', { language: 'yaml' });
        const editor = MonacoFake.editor(model);

        const ob1 = EditorYaml.Path.observe({ editor });
        const ob2 = EditorYaml.Path.observe({ editor });

        // Both views see the same current snapshot (producer is shared)
        expect(ob1.current).to.eql(ob2.current);

        const fired1: t.EventYamlCursor[] = [];
        const fired2: t.EventYamlCursor[] = [];

        // Ignore the producer’s initial snapshot emission
        const sub1 = ob1.$.pipe(Rx.skip(1)).subscribe((e) => fired1.push(e));
        const sub2 = ob2.$.pipe(Rx.skip(1)).subscribe((e) => fired2.push(e));

        editor.setPosition({ lineNumber: 1, column: 6 });

        await Schedule.macro();
        expect(fired1.length).to.eql(1);
        expect(fired2.length).to.eql(1);
        expect(fired1[0]).to.eql(fired2[0]);

        sub1.unsubscribe();
        sub2.unsubscribe();
        ob1.dispose();
        ob2.dispose();
      });

      it('increments/decrements refCount; disposes only when last consumer ends', async () => {
        const model = MonacoFake.model('foo: bar', { language: 'yaml' });
        const editor = MonacoFake.editor(model);

        const ob1 = EditorYaml.Path.observe({ editor });
        const ob2 = EditorYaml.Path.observe({ editor });

        // Dispose first consumer: producer remains alive
        ob1.dispose();
        expect(ob1.disposed).to.eql(true);
        expect(ob2.disposed).to.eql(false);

        const fired: t.EventYamlCursor[] = [];
        const sub = ob2.$.pipe(Rx.skip(1)).subscribe((e) => fired.push(e));

        expect(editor.getPosition()).to.eql({ lineNumber: 1, column: 1 }); // NB: sanity check
        editor.setPosition({ lineNumber: 1, column: 6 });
        expect(editor.getPosition()).to.eql({ lineNumber: 1, column: 6 }); // NB: sanity check

        await Schedule.macro();
        expect(fired.length).to.eql(1);
        sub.unsubscribe();

        // Disposing last consumer tears down the producer:
        ob2.dispose();
        expect(ob2.disposed).to.eql(true);

        // New observe creates a fresh producer again:
        const ob3 = EditorYaml.Path.observe({ editor });
        const again: t.EventYamlCursor[] = [];
        const sub3 = ob3.$.pipe(Rx.skip(1)).subscribe((e) => again.push(e));

        editor.setPosition({ lineNumber: 1, column: 7 });
        await Schedule.macro();
        expect(again.length).to.eql(1);

        sub3.unsubscribe();
        ob3.dispose();
      });

      it('disposes producer once refCount reaches zero (stream completes)', async () => {
        const model = MonacoFake.model('baz: 42', { language: 'yaml' });
        const editor = MonacoFake.editor(model);

        const ob = EditorYaml.Path.observe({ editor });

        const fired: t.EventYamlCursor[] = [];
        let completed = false;

        // Ignore initial snapshot; only count the next emission
        const sub = ob.$.pipe(Rx.skip(1)).subscribe({
          next: (e) => fired.push(e),
          complete: () => (completed = true),
        });

        editor.setPosition({ lineNumber: 1, column: 6 });
        await Schedule.macro();
        expect(fired.length).to.eql(1);

        // Disposing the last consumer should complete the stream
        ob.dispose();
        if (!completed) await Schedule.macro();
        expect(completed).to.eql(true);

        sub.unsubscribe();
      });
    });

    describe('ping/pong: "cursor"', () => {
      it('responds to "editor:ping" with editor:yaml:cursor + editor:pong', async () => {
        const life = Rx.disposable();
        const bus$ = Bus.make();
        const model = MonacoFake.model('foo: bar', { language: 'yaml' });
        const editor = MonacoFake.editor(model);

        // Start observing (this creates the cursor producer)
        EditorYaml.Path.observe({ editor, bus$ }, life);

        const events: t.EditorEvent[] = [];
        const sub = bus$.pipe(Rx.takeUntil(life.dispose$)).subscribe((e) => events.push(e));

        const nonce = 'nonce-123';
        bus$.next({
          kind: 'editor:ping',
          request: ['cursor'],
          nonce,
        } satisfies t.EventEditorPing);

        await Schedule.macro();
        const cursor = events.find((e) => e.kind === 'editor:yaml:cursor') as t.EventYamlCursor;
        const pong = events.find((e) => e.kind === 'editor:pong') as t.EventEditorPong;

        expect(cursor).to.exist;
        expect(pong).to.exist;
        expect(pong.nonce).to.equal(nonce);
        expect(pong.states).to.eql(['cursor']);
        expect(pong.at).to.be.a('number');

        sub.unsubscribe();
        life.dispose();
      });
    });
  });
});

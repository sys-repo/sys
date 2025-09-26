import { type t, describe, expect, it, MonacoFake, Rx } from '../../-test.ts';
import { Crdt } from './common.ts';
import { EditorCrdt } from './mod.ts';
import { __test as RegisterTest } from './u.Link.register.ts';

describe('Monaco/Crdt', { sanitizeResources: false, sanitizeOps: false }, () => {
  it('API', async () => {
    const m = await import('@sys/driver-monaco');
    expect(m.Monaco.Crdt).to.equal(EditorCrdt);
  });

  describe('Crdt.Link', () => {
    describe('Link.register', () => {
      const ready = (
        model: t.FakeTextModel,
        monaco: t.FakeMonacoGlobal = MonacoFake.monaco(),
        until?: t.UntilInput,
      ): t.MonacoEditorReady => {
        const life = Rx.lifecycle(until);
        return {
          editor: MonacoFake.editor(model),
          monaco: MonacoFake.asMonaco(monaco),
          dispose$: life.dispose$,
        };
      };
      it('emits click event with correct payload (id + path)', () => {
        const monaco = MonacoFake.monaco();
        const src = 'foo crdt:abc/one/two bar';
        const model = MonacoFake.model(src, { uri: 'inmemory://m/alpha' });

        let ev: t.EditorCrdtLinkClick | undefined;
        const life = EditorCrdt.Link.register(ready(model, monaco), {
          language: 'yaml',
          onLinkClick: (e) => (ev = e),
        });

        // Drive provider → retrieve generated links:
        const list = monaco.languages._provideLinks('yaml', model)!;
        expect(list.links.length).to.be.greaterThan(0);

        // Simulate the opener firing on that URL:
        const produced = list.links[0]!;
        const uri = produced.url as t.Monaco.Uri;
        monaco.editor._open(uri);

        // Assertions:
        expect(ev).to.exist;
        expect(ev!.raw).to.equal('crdt:abc/one/two');
        expect(ev!.is.create).to.equal(false);
        expect(ev!.path).to.eql(['one', 'two']);

        // Model + bounds:
        expect(ev!.model.uri.toString()).to.eql('inmemory://m/alpha');
        expect(ev!.bounds.model.uri.toString()).to.equal('inmemory://m/alpha');

        // Sanity on bounds positions (line 1; columns map to token):
        const { start, end, startOffset, endOffset } = ev!.bounds;
        expect(start.lineNumber).to.equal(1);
        expect(end.lineNumber).to.equal(1);
        expect(startOffset).to.be.lessThan(endOffset);

        life.dispose();
      });

      it('handles crdt:create (is.create=true) with empty path', () => {
        const monaco = MonacoFake.monaco();
        const model = MonacoFake.model('x crdt:create y', { uri: 'inmemory://m/create' });

        let ev: t.EditorCrdtLinkClick | undefined;
        const life = EditorCrdt.Link.register(ready(model, monaco), (e) => (ev = e)); // handler shorthand

        const list = monaco.languages._provideLinks('yaml', model)!;
        const uri = list.links[0]!.url as t.Monaco.Uri;
        monaco.editor._open(uri);

        expect(ev).to.exist;
        expect(ev!.raw).to.equal('crdt:create');
        expect(ev!.is.create).to.equal(true);
        expect(ev!.path).to.eql([]);
        expect(ev!.bounds.model.uri.toString()).to.equal('inmemory://m/create');

        life.dispose();
      });

      it('scopes provider to the given language id', () => {
        const monaco = MonacoFake.monaco();
        const model = MonacoFake.model('crdt:abc/x');

        // Register under 'json' not 'yaml':
        const life = EditorCrdt.Link.register(ready(model, monaco), {
          language: 'json',
          onLinkClick: () => {},
        });

        // No provider under 'yaml':
        const yamlList = monaco.languages._provideLinks('yaml', model);
        expect(yamlList).to.be.undefined;

        // Provider under 'json'
        const jsonList = monaco.languages._provideLinks('json', model);
        expect(jsonList?.links.length).to.equal(1);

        life.dispose();
      });

      it('lifecycle: disposing removes opener and provider', () => {
        const monaco = MonacoFake.monaco();
        const model = MonacoFake.model('crdt:abc/x', { uri: 'inmemory://m/life' });

        const life = EditorCrdt.Link.register(ready(model, monaco), { onLinkClick: () => {} });

        // Links exist pre-dispose
        const list = monaco.languages._provideLinks('yaml', model);
        expect(list?.links.length).to.equal(1);

        // Dispose
        life.dispose();

        // Provider removed
        const post = monaco.languages._provideLinks('yaml', model);
        expect(post).to.be.undefined;

        // Opener removed (calling _open should throw)
        const uri = monaco.Uri.from({ scheme: 'crdt', path: 'abc/x' });
        expect(() => monaco.editor._open(uri)).to.throw(/No link opener registered/);
      });

      it('encodes and decodes bounds round-trip (positions & offsets)', () => {
        const monaco = MonacoFake.monaco();
        const src = 'alpha\nbravo crdt:xyz/state tango\ncharlie';
        const model = MonacoFake.model(src, { uri: 'inmemory://m/round' });

        let ev: t.EditorCrdtLinkClick | undefined;
        const life = EditorCrdt.Link.register(ready(model, monaco), {
          onLinkClick: (e) => (ev = e),
        });

        const list = monaco.languages._provideLinks('yaml', model)!;
        const link = list.links[0]!;
        monaco.editor._open(link.url as t.Monaco.Uri);

        // Bounds match the token span and offsets map through newline accounting
        expect(ev).to.exist;
        const b = ev!.bounds;

        // start/end are on line 2
        expect(b.start.lineNumber).to.equal(2);
        expect(b.end.lineNumber).to.equal(2);

        // Offsets increase in the token
        expect(b.endOffset).to.be.greaterThan(b.startOffset);

        // The returned range equals toMonacoRange(output) shape, structurally
        expect(b.range.startLineNumber).to.equal(b.start.lineNumber);
        expect(b.range.endLineNumber).to.equal(b.end.lineNumber);

        life.dispose();
      });
    });

    describe('Link.create', () => {
      const repo = Crdt.repo();

      it('creates a doc, inserts `crdt:<id>` token, moves caret, and returns { doc }', () => {
        // Arrange.
        const ctx = MonacoFake.ctx(); // { monaco, editor, ... }
        const { editor } = ctx;

        const model = editor.getModel();
        expect(model).to.not.equal(undefined);
        model!.setValue('alpha crdt:create omega');

        const placeholder = 'crdt:create';
        const { range, startOffset } = substringBounds(model!, placeholder);

        const bounds: t.EditorLinkBounds = {
          model: { uri: model!.uri },
          range,
          startOffset,
        } as unknown as t.EditorLinkBounds;

        // Act.
        const res = EditorCrdt.Link.create(ctx, repo, bounds);

        // Assert: result shape.
        expect(res).to.be.ok;
        expect(res!.error).to.equal(undefined);
        expect(res!.doc).to.be.ok;

        // Assert: buffer updated with the exact token (and placeholder removed).
        const token = `crdt:${res!.doc!.id}`;
        const value = model!.getValue();
        expect(value).to.not.include(placeholder);
        expect(value).to.include(token);

        // Assert: token occurs exactly once.
        const escaped = token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const occurrences = (value.match(new RegExp(escaped, 'g')) ?? []).length;
        expect(occurrences).to.eql(1);

        // Assert: caret at end of inserted token.
        const expectedPos = model!.getPositionAt(startOffset + token.length);
        const pos = editor.getPosition();
        expect(pos?.lineNumber).to.eql(expectedPos.lineNumber);
        expect(pos?.column).to.eql(expectedPos.column);
      });

      it('returns { error } and performs no edits when bounds.model.uri != active model', () => {
        // Arrange
        const ctx = MonacoFake.ctx();
        const { monaco, editor } = ctx;

        const modelA = editor.getModel()!;
        modelA.setValue('xxx crdt:create yyy');

        // Different model; bounds will point here.
        const modelB = monaco.editor.createModel('hello world', 'plaintext');

        const { range, startOffset } = substringBounds(modelA, 'crdt:create');
        const before = modelA.getValue();
        const beforePos = editor.getPosition();

        const bounds: t.EditorLinkBounds = {
          model: { uri: modelB.uri },
          range,
          startOffset,
        } as unknown as t.EditorLinkBounds;

        // Act
        const res = EditorCrdt.Link.create(ctx, repo, bounds);

        // Assert: error result and no buffer change.
        expect(res).to.be.ok;
        expect(res!.doc).to.equal(undefined);
        expect(res!.error).to.be.ok;
        expect(res!.error!.message).to.be.a('string').and.to.include('model');

        const after = modelA.getValue();
        expect(after).to.eql(before);

        // Assert: caret unchanged.
        const afterPos = editor.getPosition();
        expect(afterPos?.lineNumber).to.eql(beforePos?.lineNumber);
        expect(afterPos?.column).to.eql(beforePos?.column);
      });
    });

    describe('Link.enable', () => {
      const repo = Crdt.repo();

      it('registers a listener and, on create-event, inserts token and calls onCreate', () => {
        // Arrange.
        const ctx = MonacoFake.ctx();
        const { editor } = ctx;

        const model = editor.getModel()!;
        model.setValue('alpha crdt:create omega');

        const placeholder = 'crdt:create';
        const { range, startOffset } = substringBounds(model, placeholder);

        let onCreateCalled: t.EditorCrdtLinkCreateResult | undefined;
        const life = EditorCrdt.Link.enable(ctx, repo, {
          onCreate: (res) => (onCreateCalled = res),
        });

        // Sanity: test hook captured the handler.
        expect(RegisterTest.lastHandler).to.be.a('function');

        // Act: simulate a link "create" click event (full event shape).
        const ev: t.EditorCrdtLinkClick = makeClickEvent({
          model,
          range,
          startOffset,
          create: true,
          raw: 'crdt:create',
        });

        RegisterTest.lastHandler!(ev);

        // Assert: onCreate called with { doc }.
        expect(onCreateCalled).to.be.ok;
        expect(onCreateCalled!.error).to.equal(undefined);
        expect(onCreateCalled!.doc).to.be.ok;

        // Assert: buffer updated with `crdt:<id>` and placeholder removed.
        const token = `crdt:${onCreateCalled!.doc!.id}`;
        const value = model.getValue();
        expect(value).to.not.include(placeholder);
        expect(value).to.include(token);

        // Assert: token occurs exactly once.
        const escaped = token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const occurrences = (value.match(new RegExp(escaped, 'g')) ?? []).length;
        expect(occurrences).to.eql(1);

        // Assert: caret positioned at end of token.
        const expectedPos = model.getPositionAt(startOffset + token.length);
        const pos = editor.getPosition();
        expect(pos?.lineNumber).to.eql(expectedPos.lineNumber);
        expect(pos?.column).to.eql(expectedPos.column);

        // Cleanup.
        life.dispose();
      });

      it('returns { error } via onCreate and performs no edits when bounds.model.uri != active model', () => {
        // Arrange
        const ctx = MonacoFake.ctx();
        const { monaco, editor } = ctx;

        const modelA = editor.getModel()!;
        modelA.setValue('xxx crdt:create yyy');
        const modelB = monaco.editor.createModel('hello world', 'plaintext');

        const { range, startOffset } = substringBounds(modelA, 'crdt:create');

        let onCreateCalled: t.EditorCrdtLinkCreateResult | undefined;
        const life = EditorCrdt.Link.enable(ctx, repo, {
          onCreate: (res) => (onCreateCalled = res),
        });

        const before = modelA.getValue();
        const beforePos = editor.getPosition();

        // Act: simulate event that points to the *other* model
        const ev: t.EditorCrdtLinkClick = makeClickEvent({
          model: modelB,
          range,
          startOffset,
          create: true,
          raw: 'crdt:create',
        });

        RegisterTest.lastHandler!(ev);

        // Assert: onCreate called with error, no doc.
        expect(onCreateCalled).to.be.ok;
        expect(onCreateCalled!.doc).to.equal(undefined);
        expect(onCreateCalled!.error).to.be.ok;
        expect(onCreateCalled!.error!.message).to.be.a('string').and.to.include('model');

        // Assert: no buffer change and caret unchanged.
        const after = modelA.getValue();
        expect(after).to.eql(before);
        const afterPos = editor.getPosition();
        expect(afterPos?.lineNumber).to.eql(beforePos?.lineNumber);
        expect(afterPos?.column).to.eql(beforePos?.column);

        // Cleanup.
        life.dispose();
      });

      it('ignores non-create events', () => {
        // Arrange.
        const ctx = MonacoFake.ctx();
        const { editor } = ctx;
        const model = editor.getModel()!;
        model.setValue('hello world');

        let onCreateCalled: t.EditorCrdtLinkCreateResult | undefined;
        const life = EditorCrdt.Link.enable(ctx, repo, {
          onCreate: (res) => (onCreateCalled = res),
        });

        const before = model.getValue();

        // Act: simulate a non-create event (full event shape)
        const ev: t.EditorCrdtLinkClick = makeClickEvent({
          model,
          range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
          startOffset: 0,
          create: false,
          raw: 'crdt:something',
        });

        RegisterTest.lastHandler!(ev);

        // Assert: no callback, no changes.
        expect(onCreateCalled).to.equal(undefined);
        const after = model.getValue();
        expect(after).to.eql(before);

        // Cleanup.
        life.dispose();
      });

      it('does nothing when disposed', () => {});

      it('does nothing when disposed (dispose returned lifecycle)', () => {
        const ctx = MonacoFake.ctx();
        const { editor } = ctx;
        const model = editor.getModel()!;
        model.setValue('alpha crdt:create omega');

        const placeholder = 'crdt:create';
        const { range, startOffset } = substringBounds(model, placeholder);

        let onCreateCalled: t.EditorCrdtLinkCreateResult | undefined;
        const life = EditorCrdt.Link.enable(ctx, repo, {
          onCreate: (res) => (onCreateCalled = res),
        });

        // Sanity: handler present.
        expect(RegisterTest.lastHandler).to.be.a('function');

        // Dispose the behavior.
        life.dispose();

        // After dispose, test hook should be cleared (or the handler should no-op)
        // Simulate a click event after disposal
        const ev: t.EditorCrdtLinkClick = makeClickEvent({
          model,
          range,
          startOffset,
          create: true,
          raw: 'crdt:create',
        });

        const before = model.getValue();
        const beforePos = editor.getPosition();
        if (RegisterTest.lastHandler) RegisterTest.lastHandler(ev);

        // Assert: no callback, no edits, caret unchanged.
        expect(onCreateCalled).to.eql(undefined);

        const after = model.getValue();
        expect(after).to.eql(before);

        const afterPos = editor.getPosition();
        expect(afterPos?.lineNumber).to.eql(beforePos?.lineNumber);
        expect(afterPos?.column).to.eql(beforePos?.column);
      });

      it('does nothing when external `until` lifecycle is disposed', () => {
        const ctx = MonacoFake.ctx();
        const { editor } = ctx;
        const model = editor.getModel()!;
        model.setValue('alpha crdt:create omega');

        const placeholder = 'crdt:create';
        const { range, startOffset } = substringBounds(model, placeholder);

        let onCreateCalled: t.EditorCrdtLinkCreateResult | undefined;
        const until = Rx.lifecycle();
        const life = EditorCrdt.Link.enable(ctx, repo, {
          until,
          onCreate: (res) => (onCreateCalled = res),
        });

        // Sanity: handler present.
        expect(RegisterTest.lastHandler).to.be.a('function');

        // Dispose via external lifecycle.
        until.dispose();

        const ev: t.EditorCrdtLinkClick = makeClickEvent({
          model,
          range,
          startOffset,
          create: true,
          raw: 'crdt:create',
        });

        const before = model.getValue();
        const beforePos = editor.getPosition();
        if (RegisterTest.lastHandler) RegisterTest.lastHandler(ev);

        // Assert: no callback, no edits, caret unchanged
        expect(onCreateCalled).to.equal(undefined);

        const after = model.getValue();
        expect(after).to.eql(before);

        const afterPos = editor.getPosition();
        expect(afterPos?.lineNumber).to.eql(beforePos?.lineNumber);
        expect(afterPos?.column).to.eql(beforePos?.column);

        // Clean up the main lifecycle too (no-op if already ended)
        life.dispose();
      });
    });

    /**
     * Build a valid EditorCrdtLinkClick with the required fields.
     */
    function makeClickEvent(input: {
      model: t.Monaco.TextModel;
      range: t.Monaco.I.IRange;
      startOffset: number;
      create: boolean;
      raw: string;
    }): t.EditorCrdtLinkClick {
      const { model, range, startOffset, create, raw } = input;
      const bounds: t.EditorLinkBounds = {
        model: { uri: model.uri },
        range,
        startOffset,
      } as unknown as t.EditorLinkBounds;

      // If your t.ObjectPath has a factory, use it; otherwise an empty path is fine for tests.
      const path = [] as unknown as t.ObjectPath;

      return {
        model: { uri: model.uri },
        raw,
        path,
        is: { create },
        bounds,
      } as const;
    }
  });
});

/**
 * Find bounds for the first occurrence of `substring` within `model`.
 * - Returns { range, startOffset } for use as EditorLinkBounds pieces.
 * - This derives a range from offsets (non-overlapping with RangeUtil).
 */
function substringBounds(
  model: t.Monaco.TextModel,
  substring: string,
): { range: t.Monaco.I.IRange; startOffset: number } {
  const source = model.getValue();
  const startOffset = source.indexOf(substring);
  if (startOffset < 0) throw new Error(`substring not found: ${substring}`);
  const endOffset = startOffset + substring.length;
  const start = model.getPositionAt(startOffset);
  const end = model.getPositionAt(endOffset);
  const range: t.Monaco.I.IRange = {
    startLineNumber: start.lineNumber,
    startColumn: start.column,
    endLineNumber: end.lineNumber,
    endColumn: end.column,
  };
  return { range, startOffset };
}

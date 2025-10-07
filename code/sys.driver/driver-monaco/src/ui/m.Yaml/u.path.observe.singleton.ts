import { type t, Bus, MonacoIs, Obj, Rx, Yaml } from './common.ts';
import { pathAtCaret } from './u.pathAtCaret.ts';

/**
 * Singleton path-observer registry per `editorId`.
 */
export type Producer = t.Lifecycle & {
  readonly $: t.Observable<t.EventYamlCursor>; //   shared stream (multicast)
  readonly current: t.EventYamlCursor; //           snapshot getter
  readonly editorId: t.StringId; //                 code-editor
};

/**
 * Create the single producer for an `editorId`.
 * Sets up Monaco listeners, emits on the bus, shares stream to all consumers.
 */
export function createProducer(args: {
  editor: t.Monaco.Editor;
  bus$?: t.EditorEventBus;
}): Producer {
  const { editor } = args;
  const editorId = editor.getId();
  const model = editor.getModel();
  if (!model) throw new Error('Editor has no model');

  const bus$ = args.bus$ ?? Bus.make();
  const life = Rx.lifecycle();
  const disposables: Array<{ dispose(): void }> = [];
  life.dispose$.subscribe(() => disposables.forEach((d) => d.dispose()));

  // Latest AST + version.
  let ast = Yaml.parseAst(model.getValue());
  let version = model.getVersionId();

  // Latest snapshot.
  let currentCursor: t.EventYamlCursor = makeEmptyEvent(editorId);

  const parse = () => {
    ast = Yaml.parseAst(model.getValue());
    version = model.getVersionId();
  };
  const clear = (emit = true) => {
    if (currentCursor.path.length > 0) {
      currentCursor = makeEmptyEvent(editorId);
      if (emit) Bus.emit(bus$, 'micro', currentCursor);
    }
  };

  const update = (emit = true) => {
    const info = wrangle.info(editor);
    if (!info || info.language !== 'yaml') return clear(emit);

    const { position } = info;
    const word = wrangle.wordRange(editor);
    const { offset, path } = pathAtCaret(model, ast, position);
    if (offset === -1) return clear(emit);

    const next: t.EventYamlCursor = {
      kind: 'editor:yaml:cursor',
      editorId,
      path,
      position,
      offset,
      get word() {
        return word;
      },
    };

    if (!isSameCursor(currentCursor, next)) {
      currentCursor = next;
      if (emit) Bus.emit(bus$, 'micro', next);
    } else {
      currentCursor = next;
    }
  };

  // Handlers:
  const contentSub = model.onDidChangeContent(() => {
    parse();
    update();
  });
  const cursorSub = editor.onDidChangeCursorPosition(() => {
    if (model.getVersionId() !== version) parse();
    update();
  });
  const langSub = model.onDidChangeLanguage(() => {
    parse();
    update();
  });

  disposables.push(contentSub, cursorSub, langSub);

  // Emit initial snapshot once:
  update(false /* no emit */);

  // Shared stream for all consumers (scoped & deduped).
  // NB: seed with current snapshot so late subscribers have an initial value
  const $ = bus$.pipe(
    Rx.takeUntil(life.dispose$),
    Bus.Filter.ofKind('editor:yaml:cursor'),
    Rx.filter((e) => e.editorId === editorId),
    Rx.distinctUntilChanged((a, b) => MonacoIs.cursorEqual(a, b)),
    Rx.startWith(currentCursor), // NB: seed AFTER distinct so the seed doesn't suppress the first real change.
    Rx.shareReplay({ bufferSize: 1, refCount: true }),
  );

  // Listen and respond to `ping` requests:
  bus$
    .pipe(
      Rx.takeUntil(life.dispose$),
      Bus.Filter.ofKind('editor:ping'),
      Rx.filter((e) => e.request.includes('cursor')),
    )
    .subscribe((e) => {
      Bus.emit(bus$, 'micro', currentCursor);
      Bus.pong(bus$, e.nonce, ['cursor']);
    });

  /**
   * API:
   */
  return Rx.toLifecycle<Producer>(life, {
    editorId,
    get $() {
      return $;
    },
    get current() {
      return currentCursor;
    },
  });
}

/**
 * Helpers:
 */
function makeEmptyEvent(editorId: t.StringId): t.EventYamlCursor {
  return {
    kind: 'editor:yaml:cursor',
    editorId,
    path: [],
  };
}

function isSameCursor(a: t.EventYamlCursor, b: t.EventYamlCursor) {
  // Canonical fast path:
  if (MonacoIs.cursorEqual(a, b)) return true;

  // When BOTH positions are <undefined>:
  if (!a.position && !b.position) {
    if (a.editorId !== b.editorId) return false;
    if (a.offset !== b.offset) return false;
    return Obj.Path.Is.eql(a.path, b.path);
  }

  return false; // No match.
}

const wrangle = {
  info(editor: t.Monaco.Editor) {
    const position = editor.getPosition() || undefined;
    const model = editor.getModel();
    if (!position || !model) return;
    const language = model.getLanguageId() as t.EditorLanguage;
    return { position, language } as const;
  },

  wordRange(editor: t.Monaco.Editor): t.Monaco.I.IRange | undefined {
    const position = editor.getPosition();
    const model = editor.getModel();
    if (!position || !model) return;
    const word = model.getWordAtPosition(position);
    if (!word) return;
    return {
      startLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endLineNumber: position.lineNumber,
      endColumn: word.endColumn,
    };
  },
} as const;

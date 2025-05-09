import { type t, Is, R, rx, Wrangle } from './common.ts';
import { caretStyleFactory } from './u.Caret.Style.ts';
import { Color } from './u.Color.ts';

/**
 * Manages caret/selection(s) decoration within an editor.
 */
export const Caret = {
  create(editor: t.MonacoCodeEditor, id: string, options: { color?: string } = {}): t.EditorCaret {
    const life = rx.lifecycle();
    const { dispose, dispose$ } = life;
    dispose$.subscribe(() => {
      handlerDidChangeContent.dispose();
      Decorations.clear();
      style.dispose();
      fireChanged();
      $.complete();
    });

    let _color = options.color ?? Color.next();
    let _opacity = 0.6;
    let _refs: string[] = [];
    let _selections: t.EditorRange[] = [];

    const $ = new rx.Subject<t.EditorCaretChanged>();
    const fireChanged = () =>
      $.next({
        id,
        current: [...api.selections],
        disposed: life.disposed,
      });

    const style = caretStyleFactory(editor, id);
    const model = editor.getModel()!;
    if (!model) throw new Error(`The editor did not return a text-model`);

    const Decorations = {
      add(decorations: t.monaco.editor.IModelDeltaDecoration[]) {
        _refs = model.deltaDecorations(_refs, decorations);
      },
      clear() {
        if (_refs.length > 0) _refs = model.deltaDecorations(_refs, []);
        _selections = [];
      },
    } as const;

    const updateSelections = (selections: t.EditorRange[]) => {
      type D = t.monaco.editor.IModelDeltaDecoration;
      const decorations = selections.reduce((acc, next) => {
        acc.push({
          range: Wrangle.Range.toRangeEnd(next),
          options: { className: style.class.caret },
        });
        if (!Is.singleCharRange(next)) {
          acc.push({
            range: next,
            options: { className: style.class.selection },
          });
        }
        return acc;
      }, [] as D[]);

      Decorations.add(decorations);
      _selections = selections;
    };

    const disposeOfLineOrphans = (selections: t.EditorRange[]) => {
      const text = model.getValue();
      const lines = text.split('\n');
      selections.forEach((range) => {
        const line = lines[range.endLineNumber - 1];
        if (!line) api.dispose();
      });
    };

    const handlerDidChangeContent = model.onDidChangeContent((e) =>
      disposeOfLineOrphans(api.selections),
    );

    const api: t.EditorCaret = {
      id,
      $: $.pipe(rx.takeUntil(dispose$)),

      get selections() {
        return _selections ?? [];
      },

      get color() {
        return _color;
      },

      get opacity() {
        return _opacity;
      },

      /**
       * Change the caret state.
       */
      change(args) {
        let changed = false;

        if (typeof args.color === 'string') {
          _color = args.color;
          style.update(api);
          changed = true;
        }

        if (typeof args.opacity === 'number') {
          _opacity = R.clamp(0, 1, args.opacity);
          style.update(api);
          changed = true;
        }

        if (args.selections) {
          const selections = Wrangle.Range.asRanges(args.selections);
          updateSelections(selections);
          changed = true;
        }

        if (args.selections === null) {
          Decorations.clear();
          changed = true;
        }

        if (changed) fireChanged();
        return api;
      },

      /**
       * Compare the given args with the current state.
       */
      eq(args) {
        if (args.selections === null) {
          if (!_selections) return false;
        }

        if (args.selections) {
          const selections = Wrangle.Range.asRanges(args.selections);
          if (!R.equals(selections, _selections)) return false;
        }

        if (typeof args.color === 'string') {
          if (args.color !== _color) return false;
        }

        if (typeof args.opacity === 'number') {
          if (args.opacity !== _opacity) return false;
        }

        return true;
      },

      /**
       * Lifecycle.
       */
      dispose,
      dispose$,
      get disposed() {
        return life.disposed;
      },
    };

    style.update(api);
    return api;
  },
} as const;

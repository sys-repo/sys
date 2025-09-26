import { type t, Rx } from './common.ts';

const TOKEN = /\bcrdt:(create\b|[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~\-/]+)*)\b/g;

/**
 * Test hook:
 */
export const __test = {
  lastHandler: undefined as t.EditorCrdtLinkClickHandler | undefined,
};

/**
 * Method:
 */
export const register: t.EditorCrdtRegisterLink = (ctx, opt) => {
  const { monaco, editor } = ctx;

  const options = wrangle.options(opt);
  const { language = 'yaml', onLinkClick } = options;
  const life = Rx.lifecycle(options.until);
  __test.lastHandler = onLinkClick;

  const subProvider = monaco.languages.registerLinkProvider(language, {
    provideLinks(model): t.Monaco.I.ILinksList {
      const text = model.getValue();
      const links: t.Monaco.I.ILink[] = [];

      for (const m of text.matchAll(TOKEN)) {
        if (m.index == null) continue;

        const raw = m[0];
        const payload = m[1] || '';

        const start = model.getPositionAt(m.index);
        const end = model.getPositionAt(m.index + raw.length);

        const startOffset = model.getOffsetAt(start);
        const endOffset = model.getOffsetAt(end);
        const q = new URLSearchParams({
          sl: String(start.lineNumber),
          sc: String(start.column),
          el: String(end.lineNumber),
          ec: String(end.column),
          so: String(startOffset),
          eo: String(endOffset),
          m: model.uri.toString(true),
          rt: raw,
        }).toString();

        const range: t.Monaco.I.IRange = {
          startLineNumber: start.lineNumber,
          startColumn: start.column,
          endLineNumber: end.lineNumber,
          endColumn: end.column,
        };

        links.push({
          range,
          url: monaco.Uri.from({ scheme: 'crdt', path: payload, query: q }),
          tooltip: 'CRDT link',
        });
      }

      return { links };
    },
  });

  const subOpener = monaco.editor.registerLinkOpener({
    open(uri) {
      if (life.disposed) return false;
      if (uri.scheme !== 'crdt') return false;

      const params = new URLSearchParams(uri.query || '');
      const sl = Number(params.get('sl') || 0);
      const sc = Number(params.get('sc') || 0);
      const el = Number(params.get('el') || 0);
      const ec = Number(params.get('ec') || 0);
      const startOffset = Number(params.get('so') || 0);
      const endOffset = Number(params.get('eo') || 0);
      const modelUriStr = params.get('m') || '';
      const rawToken = params.get('rt') || '';

      const modelUri: t.Monaco.Uri = modelUriStr
        ? monaco.Uri.parse(modelUriStr)
        : (editor?.getModel?.()?.uri ?? monaco.Uri.parse('inmemory://model/unknown'));

      const range: t.Monaco.I.IRange = {
        startLineNumber: sl,
        startColumn: sc,
        endLineNumber: el,
        endColumn: ec,
      };
      const start = { lineNumber: sl, column: sc };
      const end = { lineNumber: el, column: ec };

      const raw = rawToken || uri.toString(true);
      const payload = (uri.path || '').replace(/^\//, '');

      const isCreate = payload === 'create' || raw === 'crdt:create';
      const segments: t.ObjectPath = isCreate ? [] : payload ? payload.split('/') : [];
      const path = isCreate ? ([] as t.ObjectPath) : segments.slice(1);

      const model = { uri: modelUri };
      const bounds: t.EditorLinkBounds = { model, start, end, range, startOffset, endOffset };
      const ev: t.EditorCrdtLinkClick = {
        model,
        raw,
        is: { create: isCreate },
        path,
        bounds,
      };

      onLinkClick?.(ev);
      return true;
    },
  });

  /**
   * Lifecycle:
   */
  life.dispose$.subscribe(() => {
    subOpener.dispose();
    subProvider.dispose();
  });
  return life;
};

/**
 * Helpers:
 */
const wrangle = {
  options(input?: Parameters<t.EditorCrdtRegisterLink>[1]): t.EditorCrdtRegisterLinkOptions {
    if (!input) return {};
    if (typeof input === 'function') return { onLinkClick: input };
    return input;
  },
} as const;

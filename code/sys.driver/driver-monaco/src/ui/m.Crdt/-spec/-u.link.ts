import { type t, Obj } from '../common.ts';

/**
 * CRDT link wiring (single handler):
 *  - Matches: "crdt:create"  OR  "crdt:<id>[/path]"
 *  - Emits one callback with { create, path, key, uri, raw }
 *  - Scoped to YAML to avoid interference in other languages
 */
export function sampleInterceptLink(
  e: t.MonacoEditorReady,
  options: { onLinkClick?: t.OnCrdtLinkClickHandler } = {},
) {
  const { onLinkClick } = options;

  // Single pass: either "create" OR "<id>[/path...]"
  const TOKEN_REGEX = /\bcrdt:(create\b|[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~\-/]+)*)\b/g;

  const subProvider = e.monaco.languages.registerLinkProvider('yaml', {
    provideLinks(model): t.Monaco.I.ILinksList {
      const links: t.Monaco.I.ILink[] = [];
      const text = model.getValue();

      for (const m of text.matchAll(TOKEN_REGEX)) {
        if (m.index == null) continue;
        const raw = m[0]; // "crdt:create" | "crdt:0000/path"
        const payload = m[1] || ''; // "create" | "0000/path"

        const start = model.getPositionAt(m.index);
        const end = model.getPositionAt(m.index + raw.length);

        // ----------- added: encode bounds + model into URL query -----------
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
          rt: raw, // preserve the exact matched token
        }).toString();
        // ----------- added: encode bounds + model into URL query -----------

        // Use explicit URIs so opener gets a clean scheme/path split
        links.push({
          range: e.monaco.Range.fromPositions(start, end),
          // ----------- changed: include query with encoded bounds -----------
          url: e.monaco.Uri.from({ scheme: 'crdt', path: payload, query: q }),
          // ----------- changed: include query with encoded bounds -----------
          tooltip: 'CRDT Document',
        });
      }

      return { links };
    },
  });

  const subOpener = e.monaco.editor.registerLinkOpener({
    open(uri) {
      console.info('[CRDT] opener hit:', uri.toString(true));
      console.log(`⚡️💦🐷🌳🦄 🍌🧨🌼✨🧫 🫵 🐚👋🧠⚠️ 💥👁️💡─• ↑↓←→✔`);
      console.log('uri', uri);

      if (uri.scheme === 'crdt') {
        // ----------- added: parse query back into concrete bounds -----------
        const params = new URLSearchParams(uri.query || '');
        const sl = Number(params.get('sl') || 0);
        const sc = Number(params.get('sc') || 0);
        const el = Number(params.get('el') || 0);
        const ec = Number(params.get('ec') || 0);
        const so = Number(params.get('so') || 0);
        const eo = Number(params.get('eo') || 0);
        const modelUriStr = params.get('m') || '';
        const rawToken = params.get('rt') || '';

        const modelUri: t.Monaco.Uri = modelUriStr
          ? e.monaco.Uri.parse(modelUriStr)
          : e.editor?.getModel?.()?.uri ?? e.monaco.Uri.parse('inmemory://model/unknown');

        const range = {
          startLineNumber: sl,
          startColumn: sc,
          endLineNumber: el,
          endColumn: ec,
        };
        const start = { lineNumber: sl, column: sc };
        const end = { lineNumber: el, column: ec };
        // ----------- added: parse query back into concrete bounds -----------

        const raw = rawToken || uri.toString(true); // prefer exact token if available
        const payload = (uri.path || '').replace(/^\//, ''); // normalize

        const create = payload === 'create' || raw === 'crdt:create';
        const pathArray: t.ObjectPath = create ? [] : payload ? payload.split('/') : [];
        const path = pathArray.slice(1);
        const ev: t.OnCrdtLinkClick = {
          model: { uri },
          raw,
          is: { create },
          path,
          // ----------- added: attach bounds -----------
          bounds: {
            modelUri,
            start,
            end,
            range,
            startOffset: so,
            endOffset: eo,
          },
          // ----------- added: attach bounds -----------
        };
        onLinkClick?.(ev);

        console.log('ev', ev);
        console.log('ev.path', ev.path);

        return true; // Handled.
      }

      return false;
    },
  });

  e.dispose$.subscribe(() => {
    console.info('[CRDT] dispose link opener for', e.editor?.getId?.());
    subOpener.dispose();
    subProvider.dispose();
  });
}

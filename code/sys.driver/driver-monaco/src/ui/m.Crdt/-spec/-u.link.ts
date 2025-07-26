import { type t } from '../common.ts';

export function sampleInterceptLink(e: t.MonacoEditorReady) {
  const CRDT_REGEX = /\bcrdt:[\w\-./]+/g; // eg: "crdt:doc-id/path"

  /**
   * Register link provider: highlight matches.
   */
  const subProvider = e.monaco.languages.registerLinkProvider('*', {
    provideLinks(
      model: t.Monaco.TextModel,
      token: t.Monaco.CancellationToken,
    ): t.Monaco.I.ILinksList {
      const links: t.Monaco.I.ILink[] = [];
      const text = model.getValue();

      for (const match of text.matchAll(CRDT_REGEX)) {
        if (match.index == null) continue;

        const startIdx = match.index;
        const endIdx = startIdx + match[0].length;

        const startPos = model.getPositionAt(startIdx);
        const endPos = model.getPositionAt(endIdx);

        links.push({
          range: e.monaco.Range.fromPositions(startPos, endPos),
          url: match[0], // ← both string or Uri accepted.
          tooltip: 'Load CRDT',
        });
      }

      return { links };
    },
  });

  /**
   * Intercept link clicks:
   */
  const subOpener = e.monaco.editor.registerLinkOpener({
    open(uri) {
      console.info('⚡️ open/uri:', uri);
      if (uri.scheme === 'crdt') return true; // NB: true == handled.
      return false;
    },
  });

  // Clean up:
  e.dispose$.subscribe(() => {
    subOpener.dispose();
    subProvider.dispose();
  });
}

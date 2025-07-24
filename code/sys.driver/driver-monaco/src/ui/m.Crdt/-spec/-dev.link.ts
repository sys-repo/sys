import { type t } from '../common.ts';

export function linkInterceptSample(e: t.MonacoEditorReady) {
  const { monaco } = e;
  const CRDT_REGEX = /\bcrdt:[\w\-./]+/g; // eg: "crdt:doc-id/path"

  /**
   * Register link provider: highlight matches.
   */
  const subLinkProvider = monaco.languages.registerLinkProvider('*', {
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
          range: monaco.Range.fromPositions(startPos, endPos),
          url: match[0], // string or Uri both accepted.
          tooltip: 'Load CRDT',
        });
      }

      return { links };
    },
  });

  /**
   * Intercept link clicks:
   */
  const subLinkOpener = e.monaco.editor.registerLinkOpener({
    open(uri) {
      console.info('⚡️ open/uri:', uri);
      return true; // NB: true == handled.
    },
  });

  // Clean up:
  e.dispose$.subscribe(() => {
    subLinkOpener.dispose();
    subLinkProvider.dispose();
  });
}

import React, { useEffect } from 'react';
let singleton = { isImported: false };

export function useCssImports() {
  const [ready, setReady] = React.useState(singleton.isImported);

  /**
   * Effect: import CSS once-only.
   */
  useEffect(() => {
    if (singleton.isImported) return;
    importStylesheets().then(() => setReady(true));
  }, []);

  /**
   * API:
   */
  return { ready } as const;
}

/**
 * Helpers:
 */
async function importStylesheets() {
  await import('prosemirror-example-setup/style/style.css');
  await import('prosemirror-view/style/prosemirror.css');
}

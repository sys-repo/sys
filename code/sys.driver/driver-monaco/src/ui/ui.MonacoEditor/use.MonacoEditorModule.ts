import React from 'react';
import { Is } from './common.ts';

/**
 * Dynamically loads the @monaco-editor/react module at runtime.
 * - Fails fast in non-browser environments (SSR, Deno tests, etc.).
 * - Returns the Editor component once loaded, or `null` until ready.
 * - Ensures safe cleanup on unmount.
 */
export function useMonacoEditorModule() {
  type T = { Editor: (props: any) => React.ReactElement };
  const [EditorMod, setEditorMod] = React.useState<null | T>(null);

  React.useEffect(() => {
    if (!Is.browser()) throw new Error('MonacoEditor requires a browser environment.');

    let alive = true;
    (async () => {
      const mod = await import('@monaco-editor/react');
      if (!alive) return;
      setEditorMod({ Editor: mod.Editor as any });
    })();

    return () => void (alive = false);
  }, []);

  return EditorMod;
}

import { type t } from './common.ts';

type IMarkerData = t.Monaco.I.IMarkerData;

/**
 * Spy `monaco.editor.setModelMarkers` and record all calls until restored.
 */
export const forSetModelMarkers: t.SpyLib['forSetModelMarkers'] = (monaco) => {
  // Capture unbound original (no .bind) so restore() passes identity checks.
  const original = monaco.editor.setModelMarkers;

  type Fn = typeof original;
  type Args = Parameters<Fn>;
  type Call = { readonly args: Args };

  const calls: Call[] = [];
  monaco.editor.setModelMarkers = (...args: Args) => {
    calls.push({ args });
    return original.apply(monaco.editor, args); // Preserve receiver; call original with editor as `this`.
  };

  const restore = () => (monaco.editor.setModelMarkers = original);
  const getMarkers = (i = calls.length - 1) => (calls[i]?.args[2] ?? []) as readonly IMarkerData[];

  const api: t.SetModelMarkersSpy = {
    get calls() {
      return calls as readonly Call[];
    },
    getMarkers,
    restore,
  };

  return api;
};

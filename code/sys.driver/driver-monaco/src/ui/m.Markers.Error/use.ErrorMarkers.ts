import { useEffect, useRef } from 'react';
import { toMarkers } from '../../m.Error/u.markers.ts';
import { type t, slug } from './common.ts';

export const useErrorMarkers: t.UseErrorMarkers = (args) => {
  const { monaco, editor, errors = [], enabled = true } = args;

  // Stable owner.
  const ownerRef = useRef<string>(args.owner ?? slug());
  const owner = ownerRef.current;

  // Keep latest monaco/editor for unmount cleanup only.
  const monacoRef = useRef(monaco);
  const editorRef = useRef(editor);
  useEffect(() => {
    monacoRef.current = monaco;
    editorRef.current = editor;
  }, [monaco, editor]);

  // Track if we've ever written markers (so cleanup won't cause a first write).
  const didSetRef = useRef(false);

  // Cleanup on unmount: clear this owner's markers only if we had set them:
  useEffect(() => {
    return () => {
      if (!didSetRef.current) return;
      const model = editorRef.current?.getModel();
      if (model) monacoRef.current?.editor.setModelMarkers(model, owner, []);
    };
  }, [owner]);

  // Sync markers with current diagnostics (only when enabled):
  useEffect(() => {
    if (!enabled || !monaco || !editor) return;

    const model = editor.getModel();
    if (!model) return;

    if (errors.length === 0) {
      // Only clear when enabled (do nothing when disabled).
      monaco.editor.setModelMarkers(model, owner, []);
      didSetRef.current = true;
      return;
    }

    const markers = toMarkers(model, errors as t.EditorDiagnostic[]);
    monaco.editor.setModelMarkers(model, owner, markers);
    didSetRef.current = true;
  }, [enabled, monaco, editor, errors, owner]);

  // Reapply on model swaps (only when enabled):
  useEffect(() => {
    if (!editor || !monaco) return;
    const sub = editor.onDidChangeModel?.(() => {
      const model = editor.getModel();
      if (!model) return;

      if (!enabled) return; // ← nothing when disabled

      const markers = errors.length ? toMarkers(model, errors as t.EditorDiagnostic[]) : [];
      monaco.editor.setModelMarkers(model, owner, markers);
      didSetRef.current = true;
    });
    return () => sub?.dispose();
  }, [editor, monaco, enabled, errors, owner]);
};

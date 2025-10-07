import { type t } from './common.ts';

export const Error: t.EditorErrorLib = {
  toMarkers(target, errors) {
    const model = 'getModel' in target ? target.getModel() : target;
    if (!model) return [];

    return errors
      .filter((e) => Array.isArray(e.range))
      .map((e): t.Monaco.I.IMarkerData => {
        const [start, , end] = e.range!;
        const s = model.getPositionAt(start);
        const epos = model.getPositionAt(end);
        return {
          severity: 8, // ← MarkerSeverity.Error
          message: e.message,
          startLineNumber: s.lineNumber,
          startColumn: s.column,
          endLineNumber: epos.lineNumber,
          endColumn: epos.column,
        };
      });
  },
};

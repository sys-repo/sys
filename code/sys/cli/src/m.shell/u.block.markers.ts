import { Str, type t } from './common.ts';

export function markers(owner: t.Shell.Owner): t.Shell.Block.Markers {
  const name = markerName(owner);
  return {
    start: `# ━━━ BEGIN: ${name} ${'━'.repeat(54)}`,
    end: `# ━━━ END: ${name} ${'━'.repeat(56)}`,
  };
}

export function isMarkerLine(owner: t.Shell.Owner, line: string): boolean {
  const current = markers(owner);
  return line === current.start || line === current.end;
}

/**
 * Helpers:
 */
function markerName(owner: t.Shell.Owner): string {
  return Str.replaceAll(owner.label.trim(), /\s+/g, ':').after;
}

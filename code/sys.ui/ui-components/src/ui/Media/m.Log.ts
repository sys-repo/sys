import { type t } from './common.ts';

export const Log: t.MediaLogLib = {
  tracks(label: string, stream?: MediaStream) {
    if (!stream) {
      console.info(`${label}: <no stream>`);
      return;
    }

    const rows = stream.getTracks().map((t) => ({
      kind: t.kind, //                  'audio' | 'video'
      id: t.id, //                      unique track id (helps detect duplicates)
      readyState: t.readyState, //      'live' | 'ended'
      enabled: t.enabled, //            true ⇢ track actively outputs samples
      muted: t.muted, //                true ⇢ nothing coming out
      label: t.label || '(no label)',
    }));

    console.groupCollapsed(`${label} - ${rows.length} track(s)`);
    console.table(rows);
    console.groupEnd();
  },
};

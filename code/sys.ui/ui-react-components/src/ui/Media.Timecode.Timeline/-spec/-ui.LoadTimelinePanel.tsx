import React from 'react';
import { type t, Dist, Http } from '../common.ts';

export type LoadTimelinePanelSelectHandler = (e: LoadTimelinePanelSelect) => void;
export type LoadTimelinePanelSelect = {
  readonly docid: t.StringId;
  readonly path: t.StringPath;
};

export type LoadTimelinePanelProps = {
  readonly baseUrl: t.StringUrl;
  readonly style?: t.CssInput;
  readonly theme?: t.CommonTheme;
  readonly debug?: boolean;

  /**
   * Optional current loaded docid (outer state).
   * Used only to keep the selection highlight in sync.
   */
  readonly selectedDocid?: t.StringId;

  /**
   * Fired when the user selects a dist entry that looks like a slug manifest path.
   * (Eg. "manifests/slug.<docid>.playback.json")
   */
  readonly onSelect?: LoadTimelinePanelSelectHandler;
};

export const LoadTimelinePanel: React.FC<LoadTimelinePanelProps> = (props) => {
  const { baseUrl, debug = false } = props;

  const [dist, setDist] = React.useState<t.DistPkg | undefined>(undefined);
  const ctrl = Dist.useBrowserController();
  const [selectedPath, setSelectedPath] = React.useState<t.StringPath | undefined>(() => {
    return resolveSelectedPath(undefined, props.selectedDocid);
  });

  React.useEffect(() => {
    setSelectedPath(resolveSelectedPath(dist, props.selectedDocid));
  }, [dist, props.selectedDocid]);

  React.useEffect(() => {
    let disposed = false;

    (async () => {
      const http = Http.fetcher();
      const res = await http.json(`${baseUrl}/manifests/dist.json`);
      if (disposed) return;
      setDist(res.data as t.DistPkg);
    })();

    return () => {
      disposed = true;
    };
  }, [baseUrl]);

  const onSelect: t.DistBrowserSelectHandler = (e) => {
    setSelectedPath(e.path);
    ctrl.onSelect(e);

    const docid = parseDocidFromDistPath(e.path);
    if (!docid) return;

    props.onSelect?.({ docid, path: e.path });
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <Dist.UI.Browser
        debug={debug}
        theme={props.theme}
        style={props.style}
        dist={dist}
        selectedPath={selectedPath}
        onSelect={onSelect}
        filterText={ctrl.filterText}
        onFilter={ctrl.onFilter}
        toolbar={{
          placement: 'bottom',
          filterText: ctrl.filterText,
          onFilter: ctrl.onFilter,
        }}
      />
    </div>
  );
};

/** ------------------------------------------------------------
 * Helpers
 */

/**
 * Extract docid from dist path entries that represent slug manifests.
 * Eg:
 * - "manifests/slug.<docid>.playback.json"
 * - "manifests/slug.<docid>.assets.json"
 */
const parseDocidFromDistPath = (path: t.StringPath): t.StringId | undefined => {
  const m = String(path).match(/(?:^|\/)slug\.([^.\/]+)\.(?:playback|assets)\.json$/);
  return (m?.[1] as t.StringId | undefined) ?? undefined;
};

/**
 * Resolve the exact dist key to highlight for a docid.
 * This avoids mismatch when dist keys include prefixes or leading slashes.
 */
const resolveSelectedPath = (dist?: t.DistPkg, docid?: t.StringId): t.StringPath | undefined => {
  if (!docid) return undefined;

  const suffix = `slug.${docid}.playback.json`;
  const parts = dist?.hash?.parts ?? {};
  const keys = Object.keys(parts);
  const exact = keys.find((p) => p.endsWith(suffix));
  if (exact) return exact;

  // Fallback (best-effort): canonical path.
  return `manifests/${suffix}`;
};

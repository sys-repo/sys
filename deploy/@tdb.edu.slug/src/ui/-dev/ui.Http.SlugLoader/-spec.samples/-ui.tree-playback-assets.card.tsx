import { type t } from './common.ts';
import { renderTreeRefSelector } from './-ui.tree-ref-selector.tsx';

type Props = {
  selected?: string;
  refs?: string[];
  onSelect?: (next: string) => void;
};

export function renderTreePlaybackAssetsCard<TParams extends Record<string, unknown>>(
  e: t.ActionProbe.ProbeRenderArgs<t.TEnv, TParams>,
  props: Props,
) {
  e.element(
    <div>
      Loads media descriptor, resolves one <code>docid</code>, then loads assets and playback
      manifests.
    </div>,
  );

  renderTreeRefSelector(e, props);
}

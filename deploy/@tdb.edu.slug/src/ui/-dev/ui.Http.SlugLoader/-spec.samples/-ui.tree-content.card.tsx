import { type t } from './common.ts';
import { renderTreeRefSelector } from './-ui.tree-ref-selector.tsx';

type Props = {
  selected?: string;
  refs?: string[];
  totalVisible?: number | 'all';
  onSelect?: (next: string) => void;
};

export function renderTreeContentCard<TParams extends Record<string, unknown>>(
  e: t.ActionProbe.ProbeRenderArgs<t.TEnv, TParams>,
  props: Props,
) {
  e.element(
    <div>
      Loads tree, resolves one <code>ref</code>, then loads indexed file-content by hash.
    </div>,
  );

  renderTreeRefSelector(e, props);
}

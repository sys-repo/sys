import { renderTreeRefSelector } from './-ui.tree+ref-selector.tsx';
import { type t, Color, css } from './common.ts';

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
  const refs = props.refs ?? [];
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(0),
      display: 'grid',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 6,
    }),
  };
  e.element(
    <div className={css(styles.base).class}>
      <div>
        Loads tree, resolves one <code>ref</code>, then loads indexed file-content by hash.
        Flattened <code>docid</code>'s from the <code>slug-tree</code>.
      </div>
      {refs.length > 0 && (
        <div>
          Tree <code>refs</code>:
        </div>
      )}
    </div>,
  );

  renderTreeRefSelector(e, props);
}

import { renderTreeRefSelector } from './-u.treeRefSelector.tsx';
import { type t, Color, css } from './common.ts';

type O = Record<string, unknown>;
type Props = {
  selected?: string;
  refs?: string[];
  totalVisible?: number | 'all';
  onSelect?: (next: string) => void;
};

export function renderTreePlaybackCard<TParams extends O>(
  e: t.ActionProbe.ProbeRenderArgs<t.HttpDataCards.TEnv, TParams>,
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

  const elRefsTitle = refs.length > 0 && (
    <div>
      Tree <code>ref/docid</code>&apos;s:
    </div>
  );

  e.element(
    <div className={css(styles.base).class}>
      <div>
        Loads tree, resolves one <code>ref</code>, then loads the staged playback manifest.
      </div>
      {elRefsTitle}
    </div>,
  );

  renderTreeRefSelector(e, props);
}

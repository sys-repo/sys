import React from 'react';
import { type t, Color, css } from './common.ts';
import { Grid } from './ui.Grid.tsx';
import { Toolbar } from './ui.Toolbar.tsx';

/**
 * Component:
 */
const View: React.FC<t.DistBrowserProps> = (props) => {
  const { debug = false, dist, selectedPath, onSelect } = props;

  const toolbar = props.toolbar;
  const toolbarPlacement = toolbar?.placement ?? 'top';
  const hasToolbar = toolbar !== undefined;

  const gridTemplateRows = hasToolbar
    ? toolbarPlacement === 'bottom'
      ? '1fr auto'
      : 'auto 1fr'
    : '1fr';

  /**
   * Filter is resolved independent of toolbar visibility.
   * Toolbar values (when present) take precedence.
   */
  const filterText = toolbar?.filterText ?? props.filterText;
  const onFilter = toolbar?.onFilter ?? props.onFilter;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gridTemplateRows,
    }),
  } as const;

  const elToolbar = hasToolbar && (
    <Toolbar
      placement={toolbar.placement}
      theme={theme.name}
      debug={debug}
      filterText={filterText}
      onFilter={onFilter}
    />
  );

  const elGrid = (
    <Grid
      theme={theme.name}
      dist={dist}
      debug={debug}
      selectedPath={selectedPath}
      onSelect={onSelect}
      filterText={filterText}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {!hasToolbar && elGrid}
      {hasToolbar && (toolbarPlacement === 'bottom' ? elGrid : elToolbar)}
      {hasToolbar && (toolbarPlacement === 'bottom' ? elToolbar : elGrid)}
    </div>
  );
};

/**
 * Attach sub-component API
 */
const API = View as unknown as t.Mutable<t.Dist.Browser.UI>;
API.Grid = Grid;
API.Toolbar = Toolbar;
export const Browser = View as t.Dist.Browser.UI;

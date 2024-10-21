import { Color, css, R, useCurrentState, type t } from '../common.ts';
import { PanelFooter, PanelHeader } from '../Harness.Panel.Edge/mod.ts';
import { DebugPanelBody as Body } from './Panel.Body.tsx';

export type DebugPanelProps = {
  instance: t.DevInstance;
  baseRef?: React.RefObject<HTMLDivElement>;
  style?: t.CssValue;
};

export const DebugPanel: React.FC<DebugPanelProps> = (props) => {
  const { instance } = props;

  const current = useCurrentState(instance, { distinctUntil });
  const debug = current.info?.render.props?.debug;
  const width = Wrangle.width(debug);

  if (width === null) return null; // NB: configured to not render.
  const isHidden = width <= 0;

  /**
   * [Render]
   */
  const styles = {
    base: css({
      overflow: 'hidden',
      justifySelf: 'stretch',
      borderLeft: `solid 1px ${Color.format(-0.1)}`,
      width,
      display: isHidden ? 'none' : 'grid',
      gridTemplateRows: 'auto 1fr auto',
      pointerEvents: isHidden ? 'none' : undefined,
    }),
    body: css({
      Scroll: debug?.body.scroll,
      Padding: debug?.body.padding,
    }),
  };

  return (
    <div
      data-component={'dev.harness:Panel.Debug'}
      ref={props.baseRef}
      {...css(styles.base, props.style)}
    >
      <PanelHeader instance={instance} current={debug?.header} />
      <div {...styles.body}>
        <Body instance={instance} current={current.info} />
      </div>
      <PanelFooter instance={instance} current={debug?.footer} />
    </div>
  );
};

/**
 * Helpers
 */
const distinctUntil = (p: t.DevInfoChanged, n: t.DevInfoChanged) => {
  const prev = p.info;
  const next = n.info;
  if (prev.run.results?.tx !== next.run.results?.tx) return false;
  if (!R.equals(prev.render.revision, next.render.revision)) return false;
  return true;
};

const Wrangle = {
  width(debug?: t.DevRenderPropsDebug) {
    const value = debug?.width;
    if (value === null) return null;
    if (!value) return 0;
    return Math.max(0, value ?? 0);
  },
};

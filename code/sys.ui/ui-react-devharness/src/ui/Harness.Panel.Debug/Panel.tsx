import React from 'react';
import { type t, Style, Color, css, R, useCurrentState } from '../common.ts';
import { PanelFooter, PanelHeader } from '../Harness.Panel.Edge/mod.ts';
import { DebugPanelBody as Body } from './Panel.Body.tsx';

export type DebugPanelProps = {
  instance: t.DevInstance;
  baseRef?: React.RefObject<HTMLDivElement>;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

const componentAttr = 'sys.dev.harness:Panel.Debug';

export const DebugPanel: React.FC<DebugPanelProps> = (props) => {
  const { instance } = props;
  const theme = Color.theme(props.theme);

  const current = useCurrentState(instance, { distinctUntil });
  const debug = current.info?.render.props?.debug;
  const width = Wrangle.width(debug);

  if (width === null) return null; // NB: configured to not render.
  const isHidden = width <= 0;

  /**
   * Common styling for children.
   */
  React.useEffect(() => {
    const sheet = Style.Dom.stylesheet();
    sheet.rule(`[data-component="${componentAttr}"] hr`, {
      border: 'none',
      borderTop: '1px solid',
      borderColor: Color.alpha(theme.fg, 0.2),
    });
  }, []);

  /**
   * [Render]
   */
  const styles = {
    base: css({
      overflow: 'hidden',
      justifySelf: 'stretch',
      width,
      borderLeft: `solid 1px ${Color.format(-0.1)}`,
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
      ref={props.baseRef}
      data-component={componentAttr}
      className={css(styles.base, props.style).class}
    >
      <PanelHeader instance={instance} current={debug?.header} />
      <div className={styles.body.class}>
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

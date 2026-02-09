import React from 'react';
import { Sample } from '../../-dev/ui.Http.SlugLoader/mod.ts';
import { type t, ActionProbe, Color, css, Signal } from './common.ts';

/**
 * Single data-card.
 */
export type DataCardProps = {
  kind: t.DataCardKind;
  debug: t.DebugSignals;
  style?: t.CssInput;
};
export const DataCard: React.FC<DataCardProps> = (props) => {
  const { debug, kind } = props;
  const v = Signal.toObject(debug.props);

  const probeId = kind;
  const handlers = debug.action.handlers(probeId);
  const local = v.env === 'localhost';
  const loading = v.spinning && v.probe.active === probeId;
  const sample = kind === 'playback-content' ? Sample.TreePlaybackAssets : Sample.TreeContent;
  if (!v.origin) return null;

  /**
   * Render:
   */
  const theme = Color.theme(v.theme);
  const styles = {
    base: css({}),
  };

  const elCard = (
    <ActionProbe.Probe
      theme={v.theme}
      sample={sample}
      env={{
        is: { local },
        origin: v.origin,
        probe: {
          selectionList: { totalVisible: 5 },
          treeContent: {
            onRefChange: () => {},
            onRefsChange: () => {},
          },
        },
      }}
      spinning={loading}
      focused={v.probe.focused === probeId}
      onFocus={() => debug.action.focus(probeId)}
      onBlur={() => debug.action.blur(probeId)}
      onRunStart={handlers.onRunStart}
      onRunEnd={handlers.onRunEnd}
      onRunItem={handlers.onRunItem}
      onRunResult={handlers.onRunResult}
    />
  );

  const elResult = (
    <ActionProbe.Result
      spinning={loading}
      items={v.result.items}
      response={v.result.response}
      obj={v.result.obj}
      debug={v.debug}
      theme={v.theme}
      style={{ marginTop: 10, marginBottom: 10 }}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elCard}
      {elResult}
    </div>
  );
};

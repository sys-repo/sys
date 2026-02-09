import React from 'react';
import { DataCards } from '../../-dev/ui.Http.SlugLoader/mod.ts';
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
  const card = debug.card;
  const c = Signal.toObject(card.props);

  const probeId = kind;
  const handlers = card.handlers(probeId);
  const local = v.env === 'localhost';
  const loading = c.spinning && c.probe.active === probeId;
  const sample =
    kind === 'playback-content' ? DataCards.Card.TreePlaybackAssets : DataCards.Card.TreeContent;
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
      focused={c.probe.focused === probeId}
      onFocus={() => card.focus(probeId)}
      onBlur={() => card.blur(probeId)}
      onRunStart={handlers.onRunStart}
      onRunEnd={handlers.onRunEnd}
      onRunItem={handlers.onRunItem}
      onRunResult={handlers.onRunResult}
    />
  );

  const elResult = (
    <ActionProbe.Result
      spinning={loading}
      items={c.result.items}
      response={c.result.response}
      obj={c.result.obj}
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

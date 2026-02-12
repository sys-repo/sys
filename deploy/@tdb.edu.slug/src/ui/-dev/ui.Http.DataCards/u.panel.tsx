import { Descriptor } from './-spec.cards/-ui.descriptor.tsx';
import { TreeContent } from './-spec.cards/-ui.tree+file-content.tsx';
import { TreePlaybackAssets } from './-spec.cards/-ui.tree+playback-assets.tsx';
import { type t, ActionProbe, css, Signal } from './common.ts';
import { CardKindsList } from './ui/ui.CardKindsList.tsx';

/**
 * Render a single data-card panel with optional kind selector.
 */
export function createPanel(args: t.DataCardPanelArgs): t.ReactNode {
  const kind = args.kind ?? 'file-content';
  const actOn: t.ActionProbe.ActOn = ['Enter', 'Cmd+Click'];
  const c = Signal.toObject(args.signals.props);
  const local = args.env === 'localhost';
  const loading = c.spinning && c.probe.active === kind;
  const spec =
    kind === 'descriptor'
      ? Descriptor
      : kind === 'playback-content'
        ? TreePlaybackAssets
        : TreeContent;
  const handlers = args.signals.handlers(kind, spec.title);
  const runRequest = kind === 'playback-content'
    ? c.treePlayback.ref
    : kind === 'file-content'
      ? c.treeContent.ref
      : undefined;

  if (!args.origin) return null;

  const styles = {
    base: css({
      display: 'grid',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 15,
    }),
    probe: css({}),
    result: css({ marginTop: -10 }),
  };

  return (
    <div className={css(styles.base, args.style).class}>
      <CardKindsList.UI
        debug={args.debug}
        theme={args.theme}
        selected={kind}
        kinds={args.kinds}
        onKindSelect={(e) => args.onKindSelect?.(e.id)}
      />
      <ActionProbe.Probe
        style={styles.probe}
        debug={args.debug}
        theme={args.theme}
        actOn={actOn}
        spec={spec}
        runRequest={runRequest}
        env={{
          is: { local },
          origin: args.origin,
          probe: {
            selectionList: { totalVisible: c.selectionList.totalVisible },
            descriptor: { kind: 'slug-tree:fs', onKindChange: () => {} },
            treeContent: {
              ref: c.treeContent.ref,
              refs: c.treeContent.refs,
              onRefChange: (next) => (args.signals.props.treeContent.ref.value = next),
              onRefsChange: (next) => (args.signals.props.treeContent.refs.value = next),
            },
            treePlayback: {
              ref: c.treePlayback.ref,
              refs: c.treePlayback.refs,
              onRefChange: (next) => (args.signals.props.treePlayback.ref.value = next),
              onRefsChange: (next) => (args.signals.props.treePlayback.refs.value = next),
            },
          },
        }}
        spinning={loading}
        focused={c.probe.focused === kind}
        onFocus={() => args.signals.focus(kind, spec.title)}
        onBlur={() => args.signals.blur(kind)}
        onRunStart={handlers.onRunStart}
        onRunEnd={handlers.onRunEnd}
        onRunItem={handlers.onRunItem}
        onRunResult={handlers.onRunResult}
      />
      <ActionProbe.Result
        style={styles.result}
        title={c.result.title ?? spec.title}
        resultsVisible={c.result.visible}
        onResultsVisibleChange={(next) => args.signals.resultVisible(next)}
        spinning={loading}
        items={c.result.items}
        response={c.result.response}
        obj={c.result.obj}
        debug={args.debug}
        theme={args.theme}
      />
    </div>
  );
}

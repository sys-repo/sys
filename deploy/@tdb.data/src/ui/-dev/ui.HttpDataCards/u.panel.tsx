import { CardKindsList } from './ui/ui.CardKindsList.tsx';
import { TreeContent } from './-spec.cards/-ui.tree+file-content.tsx';
import { TreePlayback } from './-spec.cards/-ui.tree+playback.tsx';
import { type t, ActionProbe, css, Signal } from './common.ts';

export function createPanel(args: t.HttpDataCards.PanelArgs): t.ReactNode {
  const actOn: t.ActionProbe.ActOn = ['Enter', 'Cmd+Click'];
  const c = Signal.toObject(args.signals.props);
  const loading = c.spinning && c.probe.active === args.kind;

  const styles = {
    base: css({
      display: 'grid',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 15,
    }),
    result: css({ marginTop: -10 }),
  };

  return (
    <div className={css(styles.base, args.style).class}>
      <CardKindsList.UI
        debug={args.debug}
        theme={args.theme}
        selected={args.kind}
        onKindSelect={(e) => args.onKindSelect?.(e.id)}
      />
      {args.kind === 'playback-content'
        ? renderPlaybackProbe({ args, c, actOn, loading })
        : renderTreeContentProbe({ args, c, actOn, loading })}
      <ActionProbe.Result
        style={styles.result}
        title={c.result.title ?? (args.kind === 'playback-content' ? TreePlayback.title : TreeContent.title)}
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

function renderTreeContentProbe(args: {
  args: t.HttpDataCards.PanelArgs;
  c: t.HttpDataCards.SignalsState;
  actOn: t.ActionProbe.ActOn;
  loading: boolean;
}) {
  const handlers = args.args.signals.handlers('file-content', TreeContent.title);

  return (
    <ActionProbe.Probe
      debug={args.args.debug}
      theme={args.args.theme}
      actOn={args.actOn}
      spec={TreeContent}
      runRequest={args.c.treeContent.ref}
      env={toEnv(args)}
      spinning={args.loading}
      focused={args.c.probe.focused === 'file-content'}
      onFocus={() => args.args.signals.focus('file-content', TreeContent.title)}
      onBlur={() => args.args.signals.blur('file-content')}
      onRunStart={handlers.onRunStart}
      onRunEnd={handlers.onRunEnd}
      onRunItem={handlers.onRunItem}
      onRunResult={handlers.onRunResult}
    />
  );
}

function renderPlaybackProbe(args: {
  args: t.HttpDataCards.PanelArgs;
  c: t.HttpDataCards.SignalsState;
  actOn: t.ActionProbe.ActOn;
  loading: boolean;
}) {
  const handlers = args.args.signals.handlers('playback-content', TreePlayback.title);

  return (
    <ActionProbe.Probe
      debug={args.args.debug}
      theme={args.args.theme}
      actOn={args.actOn}
      spec={TreePlayback}
      runRequest={args.c.treePlayback.ref}
      env={toEnv(args)}
      spinning={args.loading}
      focused={args.c.probe.focused === 'playback-content'}
      onFocus={() => args.args.signals.focus('playback-content', TreePlayback.title)}
      onBlur={() => args.args.signals.blur('playback-content')}
      onRunStart={handlers.onRunStart}
      onRunEnd={handlers.onRunEnd}
      onRunItem={handlers.onRunItem}
      onRunResult={handlers.onRunResult}
    />
  );
}

function toEnv(args: {
  args: t.HttpDataCards.PanelArgs;
  c: t.HttpDataCards.SignalsState;
}): t.HttpDataCards.TEnv {
  return {
    origin: args.args.origin,
    dataset: args.args.dataset,
    docid: args.args.docid,
    probe: {
      selectionList: { totalVisible: args.c.selectionList.totalVisible },
      treeContent: {
        ref: args.c.treeContent.ref,
        refs: args.c.treeContent.refs,
        onRefChange: (next: string) => (args.args.signals.props.treeContent.ref.value = next),
        onRefsChange: (next: string[]) => (args.args.signals.props.treeContent.refs.value = next),
      },
      treePlayback: {
        ref: args.c.treePlayback.ref,
        refs: args.c.treePlayback.refs,
        onRefChange: (next: string) => (args.args.signals.props.treePlayback.ref.value = next),
        onRefsChange: (next: string[]) => (args.args.signals.props.treePlayback.refs.value = next),
      },
    },
  };
}

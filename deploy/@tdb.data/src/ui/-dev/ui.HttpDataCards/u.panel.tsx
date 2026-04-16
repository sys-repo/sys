import { TreeContent } from './-spec.cards/-ui.tree+file-content.tsx';
import { type t, ActionProbe, css, Signal } from './common.ts';

export function createPanel(args: t.HttpDataCards.PanelArgs): t.ReactNode {
  const actOn: t.ActionProbe.ActOn = ['Enter', 'Cmd+Click'];
  const c = Signal.toObject(args.signals.props);
  const loading = c.spinning && c.probe.active === 'file-content';
  const handlers = args.signals.handlers('file-content', TreeContent.title);

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
      <ActionProbe.Probe
        debug={args.debug}
        theme={args.theme}
        actOn={actOn}
        spec={TreeContent}
        runRequest={c.treeContent.ref}
        env={{
          origin: args.origin,
          dataset: args.dataset,
          docid: args.docid,
          probe: {
            selectionList: { totalVisible: c.selectionList.totalVisible },
            treeContent: {
              ref: c.treeContent.ref,
              refs: c.treeContent.refs,
              onRefChange: (next: string) => (args.signals.props.treeContent.ref.value = next),
              onRefsChange: (next: string[]) => (args.signals.props.treeContent.refs.value = next),
            },
          },
        }}
        spinning={loading}
        focused={c.probe.focused === 'file-content'}
        onFocus={() => args.signals.focus('file-content', TreeContent.title)}
        onBlur={() => args.signals.blur('file-content')}
        onRunStart={handlers.onRunStart}
        onRunEnd={handlers.onRunEnd}
        onRunItem={handlers.onRunItem}
        onRunResult={handlers.onRunResult}
      />
      <ActionProbe.Result
        style={styles.result}
        title={c.result.title ?? TreeContent.title}
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

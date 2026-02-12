import React from 'react';
import { DataCards } from '../../-dev/ui.Http.DataCards/mod.ts';
import { type t, css } from './common.ts';
import { ActionProbe, Is, Signal, TreeHost } from './mod.ts';

type Props = {
  debug: t.DebugSignals;
  style?: t.CssValue;
};

export const SlugActionProbe: React.FC<Props> = (props) => {
  const { debug } = props;
  const probeId = 'tree-content';
  const spec = DataCards.Card.TreeContent;
  const handlers = debug.action.handlers(probeId, spec.title);
  const p = debug.props;
  const v = Signal.toObject(p);
  const local = v.env === 'localhost';
  const loading = v.spinning && v.probe.active === probeId;
  if (!v.origin) return null;

  /**
   * Render
   */
  const styles = {
    base: css({}),
  };

  const elCard = (
    <ActionProbe.Probe
      theme={v.theme}
      spec={spec}
      env={{
        is: { local },
        origin: v.origin,
        probe: {
          selectionList: { totalVisible: 3 },
          treeContent: {
            ref: v.treeContentRef,
            refs: v.treeContentRefs,
            onRefChange(next: string) {
              p.treeContentRef.value = next;
            },
            onRefsChange: (next: string[]) => (p.treeContentRefs.value = next),
          },
        },
      }}
      spinning={loading}
      focused={v.probe.focused === probeId}
      onFocus={() => debug.action.focus(probeId, spec.title)}
      onBlur={() => debug.action.blur(probeId)}
      onRunStart={handlers.onRunStart}
      onRunEnd={handlers.onRunEnd}
      onRunItem={handlers.onRunItem}
      onRunResult={(value, obj) => {
        syncLoadedTree(value, p.tree);
        handlers.onRunResult(value, { ...(obj ?? {}), expand: { paths: ['$'] } });
      }}
    />
  );

  const elResult = (
    <ActionProbe.Result
      title={v.result.title ?? spec.title}
      resultsVisible={v.result.visible}
      spinning={loading}
      items={v.result.items}
      response={v.result.response}
      obj={v.result.obj}
      debug={v.debug}
      theme={v.theme}
      onResultsVisibleChange={(next) => debug.action.resultVisible(next)}
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

/**
 * Helpers
 */
function syncLoadedTree(value: unknown, tree: t.Signal<t.TreeHostViewNodeList | undefined>) {
  if (!Is.object(value)) return;
  const result = value as { ok?: unknown; value?: unknown };

  if (result.ok !== true) return;
  if (!Is.object(result.value)) return;

  const payload = result.value as { tree?: unknown };
  const loaded = payload.tree;
  if (!isSlugTreeDoc(loaded)) return;
  tree.value = TreeHost.Data.fromSlugTree(loaded);
}

function isSlugTreeDoc(input: unknown): input is t.SlugTreeDoc {
  if (!Is.object(input)) return false;
  const doc = input as { tree?: unknown };
  return Is.array(doc.tree);
}

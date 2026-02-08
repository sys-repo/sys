import React from 'react';
import { Sample } from '../../-dev/ui.Http.SlugLoader/-spec.samples/mod.ts';
import { ActionProbe, Signal } from './mod.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';
import { t, css } from './common.ts';

type Props = {
  debug: DebugSignals;
};

export const SlugData: React.FC<Props> = (props) => {
  const { debug } = props;
  const probeId = 'tree-content';
  const handlers = debug.action.handlers(probeId);
  const p = debug.props;
  const v = Signal.toObject(p);
  const local = v.env === 'localhost';
  if (!v.origin) return null;

  return (
    <>
      <hr />
      <ActionProbe.Probe
        sample={Sample.TreeContent}
        env={{
          is: { local },
          origin: v.origin,
          probe: {
            selectionList: { totalVisible: 5 },
            treeContent: {
              ref: v.treeContentRef,
              refs: v.treeContentRefs,
              onRefChange: (next) => (p.treeContentRef.value = next),
              onRefsChange: (next) => (p.treeContentRefs.value = next),
            },
          },
        }}
        spinning={v.spinning && v.probe.active === probeId}
        focused={v.probe.focused === probeId}
        onFocus={() => debug.action.focus(probeId)}
        onBlur={() => debug.action.blur(probeId)}
        onRunStart={handlers.onRunStart}
        onRunEnd={handlers.onRunEnd}
        onRunItem={handlers.onRunItem}
        onRunResult={(value, obj) =>
          handlers.onRunResult(value, {
            ...(obj ?? {}),
            expand: { paths: ['$'] },
          })
        }
        theme={v.theme}
        style={{ marginTop: 30 }}
      />
      <ActionProbe.Result
        spinning={v.spinning}
        items={v.result.items}
        response={v.result.response}
        obj={v.result.obj}
        debug={v.debug}
        theme={v.theme}
        style={{
          marginTop: 10,
          marginBottom: 10,
          minHeight: 400,
        }}
      />
    </>
  );
};

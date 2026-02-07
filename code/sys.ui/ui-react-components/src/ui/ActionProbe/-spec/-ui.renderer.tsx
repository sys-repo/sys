import { type t, Signal } from '../common.ts';
import { ActionProbe } from '../mod.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

type TEnv = { readonly is: { readonly local: boolean } };
type TSample = t.ActionProbe.ProbeSpec<TEnv>;
type Options = { theme?: t.CommonTheme };

export function renderer(debug: DebugSignals, opts: Options = {}) {
  const items: t.ReactNode[] = [];
  const create = (sample: TSample) => render(debug, sample, items.length, opts);
  const push = (sample: TSample) => items.push(create(sample));
  const hr = () => items.push(<hr key={`hr-${items.length}`} />);
  return { items, push, hr } as const;
}

function render(debug: DebugSignals, sample: TSample, index: t.Index, opts: Options) {
  const action = debug.action;
  const p = debug.props;
  const v = Signal.toObject(p);
  const local = v.env === 'localhost';
  const probe = String(index);

  return (
    <ActionProbe.Probe
      //
      style={{ MarginY: 8, MarginX: 15 }}
      key={probe}
      env={{ is: { local } }}
      spinning={v.spinning && v.probe.active === probe}
      theme={opts.theme ?? v.theme}
      debug={v.debug}
      sample={sample}
      onRunStart={() => action.start(probe)}
      onRunEnd={() => action.end()}
      onRunResult={(value) => action.result(value)}
      onRunItem={(item) => action.item(item)}
    />
  );
}

import { type t, Signal, ActionProbe } from './common.ts';

type Options = { theme?: t.CommonTheme };
type TSample = t.ActionProbe.ProbeSpec;

export function renderer(debug: t.DebugSignals, opts: Options = {}) {
  const items: t.ReactNode[] = [];
  const create = (sample: TSample) => render(debug, sample, items.length - 1, opts);
  const push = (sample: TSample) => items.push(create(sample));
  const hr = () => items.push(<hr key={items.length} />);
  return { items, push, hr } as const;
}

function render(debug: t.DebugSignals, sample: TSample, index: t.Index, opts: Options) {
  const action = debug.action;
  const p = debug.props;
  const v = Signal.toObject(p);
  const local = v.env === 'localhost';
  const origin = v.origin;
  const probe = String(index);
  if (!origin) return null;

  return (
    <ActionProbe.Probe
      //
      style={{ MarginY: 8 }}
      key={probe}
      origin={origin}
      is={{ local }}
      spinning={v.spinning && v.activeProbe === probe}
      theme={opts.theme ?? v.theme}
      debug={v.debug}
      sample={sample}
      onRunStart={() => {
        action.start(probe);
      }}
      onRunEnd={() => {
        action.end();
      }}
      onRunResult={(value) => {
        action.result(value);
      }}
      onRunItem={(item) => {
        action.item(item);
      }}
    />
  );
}

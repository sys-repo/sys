import { type t, Signal, SlugLoader } from './common.ts';

type Options = { theme?: t.CommonTheme };
type TSample = t.SlugLoaderView.FetchSample;

export function renderer(debug: t.DebugSignals, opts: Options = {}) {
  const items: t.ReactNode[] = [];
  const create = (sample: TSample) => render(debug, sample, items.length - 1, opts);
  const push = (sample: TSample) => items.push(create(sample));
  const hr = () => items.push(<hr key={items.length} />);
  return { items, push, hr } as const;
}

function render(debug: t.DebugSignals, sample: TSample, index: t.Index, opts: Options) {
  const v = Signal.toObject(debug.props);
  const local = v.env === 'localhost';
  const origin = v.origin;
  if (!origin) return null;

  return (
    <SlugLoader.Probe
      //
      key={index}
      origin={origin}
      is={{ local }}
      theme={opts.theme ?? v.theme}
      debug={v.debug}
      sample={sample}
    />
  );
}

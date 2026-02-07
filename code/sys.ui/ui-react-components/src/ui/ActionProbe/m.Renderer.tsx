import { type t } from './common.ts';
import { Probe } from './ui.Probe.tsx';

export const Renderer: t.ActionProbeRendererLib = {
  create<TState, TEnv extends Record<string, unknown>>(args: t.ActionProbeRendererFactoryArgs<TState, TEnv>) {
    const items: t.ReactNode[] = [];
    let index = 0;

    const api: t.ActionProbeRenderer<TEnv> = {
      items,
      push(sample) {
        const probe = String(index);
        const resolved = args.resolve({
          state: args.state,
          index,
          probe,
          sample: sample as t.ActionProbe.ProbeSpec,
        });
        index++;
        if (!resolved) {
          items.push(null);
          return api;
        }

        items.push(
          <Probe
            key={`probe-${probe}`}
            style={args.style}
            sample={sample}
            env={resolved.env}
            spinning={resolved.spinning}
            theme={resolved.theme}
            debug={resolved.debug}
            onRunStart={resolved.onRunStart}
            onRunEnd={resolved.onRunEnd}
            onRunResult={resolved.onRunResult}
            onRunItem={resolved.onRunItem}
          />,
        );
        return api;
      },
      hr() {
        items.push(<hr key={`hr-${index}-${items.length}`} />);
        return api;
      },
    };

    return api;
  },
};

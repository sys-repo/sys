import { type t } from './common.ts';
import { Probe } from './ui.Probe.tsx';

export const Renderer: t.ActionProbeRendererLib = {
  create<TState, TEnv extends Record<string, unknown>>(args: t.ActionProbeRendererFactoryArgs<TState, TEnv>) {
    const items: t.ReactNode[] = [];
    let index = 0;

    const api: t.ActionProbeRenderer<TEnv> = {
      items,
      push(spec) {
        const probe = String(index);
        const resolved = args.resolve({ state: args.state, index, probe });
        index++;
        if (!resolved) {
          items.push(null);
          return api;
        }

        items.push(
          <Probe
            key={`probe-${probe}`}
            style={args.style}
            spec={spec}
            env={resolved.env}
            runRequest={resolved.runRequest}
            spinning={resolved.spinning}
            focused={resolved.focused}
            actOn={resolved.actOn}
            theme={resolved.theme}
            debug={resolved.debug}
            onRunStart={resolved.onRunStart}
            onRunEnd={resolved.onRunEnd}
            onRunResult={resolved.onRunResult}
            onRunItem={resolved.onRunItem}
            onFocus={resolved.onFocus}
            onBlur={resolved.onBlur}
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

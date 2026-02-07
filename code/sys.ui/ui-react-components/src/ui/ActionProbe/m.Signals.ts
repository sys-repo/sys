import { type t, Signal } from './common.ts';

const defaults: t.ActionProbeSignalsState = {
  spinning: false,
  probe: { active: undefined },
  result: { items: [], response: undefined, obj: undefined },
};

export const Signals: t.ActionProbeSignalsLib = {
  create(input = {}) {
    const initial: t.ActionProbeSignalsState = {
      spinning: input.spinning ?? defaults.spinning,
      probe: {
        active: input.probe?.active ?? defaults.probe.active,
      },
      result: {
        items: input.result?.items ?? defaults.result.items,
        response: input.result?.response ?? defaults.result.response,
        obj: input.result?.obj ?? defaults.result.obj,
      },
    };

    const s = Signal.create;
    const props: t.ActionProbeSignalProps = {
      spinning: s(initial.spinning),
      probe: {
        active: s(initial.probe.active),
      },
      result: {
        items: s(initial.result.items),
        response: s(initial.result.response),
        obj: s(initial.result.obj),
      },
    };

    const api: t.ActionProbeSignals = {
      get props() {
        return props;
      },
      handlers(probe) {
        return {
          onRunStart: () => {
            api.start(probe);
          },
          onRunEnd: () => {
            api.end();
          },
          onRunResult: (value, obj) => {
            api.result(value, obj);
          },
          onRunItem: (item) => {
            api.item(item);
          },
        };
      },
      start(probe) {
        props.probe.active.value = probe;
        props.result.items.value = [];
        props.result.response.value = undefined;
        props.result.obj.value = undefined;
        props.spinning.value = true;
        return api;
      },
      item(item) {
        props.result.items.value = [...props.result.items.value, item];
        return api;
      },
      result(value, obj) {
        props.result.response.value = value;
        props.result.obj.value = obj;
        return api;
      },
      end() {
        props.spinning.value = false;
        return api;
      },
      reset() {
        props.spinning.value = defaults.spinning;
        props.probe.active.value = defaults.probe.active;
        props.result.items.value = defaults.result.items;
        props.result.response.value = defaults.result.response;
        props.result.obj.value = defaults.result.obj;
        return api;
      },
    };

    return api;
  },
};

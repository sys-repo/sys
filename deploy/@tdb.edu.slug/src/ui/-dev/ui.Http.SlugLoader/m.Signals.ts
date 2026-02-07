import { type t, Signal } from './common.ts';

const defaults: t.ActionProbeSignalsState = {
  activeProbe: undefined,
  resultItems: [],
  response: undefined,
  spinning: false,
};

export const Signals: t.ActionProbeSignalsLib = {
  create(input = {}) {
    const initial = { ...defaults, ...input };
    const s = Signal.create;
    const props: t.ActionProbeSignalProps = {
      activeProbe: s(initial.activeProbe),
      resultItems: s(initial.resultItems),
      response: s(initial.response),
      spinning: s(initial.spinning),
    };

    const api: t.ActionProbeSignals = {
      get props() {
        return props;
      },
      start(probe) {
        props.activeProbe.value = probe;
        props.resultItems.value = [];
        props.response.value = undefined;
        props.spinning.value = true;
        return api;
      },
      item(item) {
        props.resultItems.value = [...props.resultItems.value, item];
        return api;
      },
      result(value) {
        props.response.value = value;
        return api;
      },
      end() {
        props.spinning.value = false;
        return api;
      },
      reset() {
        props.activeProbe.value = defaults.activeProbe;
        props.resultItems.value = defaults.resultItems;
        props.response.value = defaults.response;
        props.spinning.value = defaults.spinning;
        return api;
      },
    };

    return api;
  },
};

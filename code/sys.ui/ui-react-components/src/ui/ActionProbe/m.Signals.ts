import { type t, Signal } from './common.ts';

const defaults: t.ActionProbeSignalsState = {
  spinning: false,
  probe: { active: undefined, focused: undefined },
  result: { title: undefined, visible: true, items: [], response: undefined, obj: undefined },
};

export const Signals: t.ActionProbeSignalsLib = {
  create(input = {}) {
    const initial: t.ActionProbeSignalsState = {
      spinning: input.spinning ?? defaults.spinning,
      probe: {
        active: input.probe?.active ?? defaults.probe.active,
        focused: input.probe?.focused ?? defaults.probe.focused,
      },
      result: {
        title: input.result?.title ?? defaults.result.title,
        visible: input.result?.visible ?? defaults.result.visible,
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
        focused: s(initial.probe.focused),
      },
      result: {
        title: s(initial.result.title),
        visible: s(initial.result.visible),
        items: s(initial.result.items),
        response: s(initial.result.response),
        obj: s(initial.result.obj),
      },
    };

    const api: t.ActionProbeSignals = {
      get props() {
        return props;
      },
      handlers(probe, title) {
        return {
          onRunStart(args) {
            api.start(probe, args?.title ?? title);
          },
          onRunEnd() {
            api.end();
          },
          onRunResult(value, obj) {
            api.result(value, obj);
          },
          onRunItem(item) {
            api.item(item);
          },
        };
      },
      start(probe, title) {
        props.probe.active.value = probe;
        props.probe.focused.value = probe;
        props.result.title.value = title;
        props.result.items.value = [];
        props.result.response.value = undefined;
        props.result.obj.value = undefined;
        props.spinning.value = true;
        return api;
      },
      focus(probe) {
        props.probe.focused.value = probe;
        return api;
      },
      blur(probe) {
        if (probe && props.probe.focused.value !== probe) return api;
        props.probe.focused.value = undefined;
        return api;
      },
      resultVisible(next) {
        props.result.visible.value =
          typeof next === 'function' ? next(props.result.visible.value) : next;
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
        props.probe.focused.value = defaults.probe.focused;
        props.result.title.value = defaults.result.title;
        props.result.visible.value = defaults.result.visible;
        props.result.items.value = defaults.result.items;
        props.result.response.value = defaults.result.response;
        props.result.obj.value = defaults.result.obj;
        return api;
      },
    };

    return api;
  },
};

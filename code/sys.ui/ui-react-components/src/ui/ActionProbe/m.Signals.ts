import { type t, Signal } from './common.ts';

const defaults: t.ActionProbeSignalsState = {
  spinning: false,
  probe: { active: undefined, focused: undefined },
  result: { title: undefined, visible: true, items: [], response: undefined, obj: undefined, byProbe: {} },
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
        byProbe: input.result?.byProbe ?? defaults.result.byProbe,
      },
    };

    const s = Signal.create;
    const probeTitles: Record<string, t.ReactNode | undefined> = {};
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
        byProbe: s(initial.result.byProbe),
      },
    };

    const snapshot = (probe: string): t.ActionProbeResultSnapshot | undefined => {
      return props.result.byProbe.value[probe];
    };
    const patchSnapshot = (
      probe: string,
      next: Partial<t.ActionProbeResultSnapshot>,
    ): t.ActionProbeResultSnapshot => {
      const current = snapshot(probe) ?? {
        title: undefined,
        items: [],
        response: undefined,
        obj: undefined,
      };
      const patched = { ...current, ...next };
      props.result.byProbe.value = { ...props.result.byProbe.value, [probe]: patched };
      return patched;
    };
    const project = (next: t.ActionProbeResultSnapshot) => {
      props.result.title.value = next.title;
      props.result.items.value = next.items;
      props.result.response.value = next.response;
      props.result.obj.value = next.obj;
    };

    const api: t.ActionProbeSignals = {
      get props() {
        return props;
      },
      handlers(probe, title) {
        if (title !== undefined) probeTitles[probe] = title;
        return {
          onRunStart(args) {
            api.start(probe, args?.title ?? title);
          },
          onRunTitle(title) {
            probeTitles[probe] = title;
            props.result.title.value = title;
            patchSnapshot(probe, { title });
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
        if (title !== undefined) probeTitles[probe] = title;
        props.probe.active.value = probe;
        props.probe.focused.value = probe;
        props.result.title.value = title;
        props.result.items.value = [];
        props.result.response.value = undefined;
        props.result.obj.value = undefined;
        patchSnapshot(probe, { title, items: [], response: undefined, obj: undefined });
        props.spinning.value = true;
        return api;
      },
      focus(probe, title) {
        if (title !== undefined) probeTitles[probe] = title;
        props.probe.focused.value = probe;
        const next = snapshot(probe);
        if (next) {
          project(next);
        } else {
          props.result.title.value = probeTitles[probe];
          props.result.items.value = [];
          props.result.response.value = undefined;
          props.result.obj.value = undefined;
        }
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
        const items = [...props.result.items.value, item];
        props.result.items.value = items;
        const probe = props.probe.active.value;
        if (probe) patchSnapshot(probe, { items });
        return api;
      },
      result(value, obj) {
        props.result.response.value = value;
        props.result.obj.value = obj;
        const probe = props.probe.active.value;
        if (probe) patchSnapshot(probe, { response: value, obj });
        return api;
      },
      end() {
        props.spinning.value = false;
        return api;
      },
      reset() {
        for (const key of Object.keys(probeTitles)) delete probeTitles[key];
        props.spinning.value = defaults.spinning;
        props.probe.active.value = defaults.probe.active;
        props.probe.focused.value = defaults.probe.focused;
        props.result.title.value = defaults.result.title;
        props.result.visible.value = defaults.result.visible;
        props.result.items.value = defaults.result.items;
        props.result.response.value = defaults.result.response;
        props.result.obj.value = defaults.result.obj;
        props.result.byProbe.value = defaults.result.byProbe;
        return api;
      },
    };

    return api;
  },
};

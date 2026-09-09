import { type t, Is, Signal } from './common.ts';
import { Persist } from './m.Signals.persist.ts';

const defaults: t.ActionProbe.SignalsState = {
  spinning: false,
  probe: { active: undefined, focused: undefined },
  result: {
    title: undefined,
    visible: true,
    items: [],
    response: undefined,
    obj: undefined,
    byProbe: {},
  },
};

export const Signals: t.ActionProbe.SignalsLib = {
  create<TPersist extends t.JsonMapU = t.JsonMapU>(input = {}) {
    const args = wrangle.createArgs<TPersist>(input);
    const inputDefaults = args.defaults ?? {};
    const persist = args.persist;
    const persistSlot = Persist.slot(args.persistKey);
    const persistedVisible = Persist.readVisible(persist, persistSlot);

    const initial: t.ActionProbe.SignalsState = {
      spinning: inputDefaults.spinning ?? defaults.spinning,
      probe: {
        active: inputDefaults.probe?.active ?? defaults.probe.active,
        focused: inputDefaults.probe?.focused ?? defaults.probe.focused,
      },
      result: {
        title: inputDefaults.result?.title ?? defaults.result.title,
        visible: inputDefaults.result?.visible ?? persistedVisible ?? defaults.result.visible,
        items: inputDefaults.result?.items ?? defaults.result.items,
        response: inputDefaults.result?.response ?? defaults.result.response,
        obj: inputDefaults.result?.obj ?? defaults.result.obj,
        byProbe: inputDefaults.result?.byProbe ?? defaults.result.byProbe,
      },
    };

    const s = Signal.create;
    const probeTitles: Record<string, t.ReactNode | undefined> = {};
    const props: t.ActionProbe.SignalProps = {
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

    const snapshot = (probe: string): t.ActionProbe.ResultSnapshot | undefined => {
      return props.result.byProbe.value[probe];
    };
    const patchSnapshot = (
      probe: string,
      next: Partial<t.ActionProbe.ResultSnapshot>,
    ): t.ActionProbe.ResultSnapshot => {
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
    const project = (next: t.ActionProbe.ResultSnapshot) => {
      props.result.title.value = next.title;
      props.result.items.value = next.items;
      props.result.response.value = next.response;
      props.result.obj.value = next.obj;
    };

    const api: t.ActionProbe.Signals = {
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
        Persist.writeVisible(persist, persistSlot, props.result.visible.value);
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
        Persist.writeVisible(persist, persistSlot, defaults.result.visible);
        return api;
      },
    };

    return api;
  },
};

const wrangle = {
  createArgs<TPersist extends t.JsonMapU>(
    input: Partial<t.ActionProbe.SignalsState> | t.ActionProbe.SignalsCreateArgs<TPersist>,
  ): t.ActionProbe.SignalsCreateArgs<TPersist> {
    if (!wrangle.isCreateArgs(input)) return { defaults: input };
    return input;
  },

  isCreateArgs<TPersist extends t.JsonMapU>(
    input: unknown,
  ): input is t.ActionProbe.SignalsCreateArgs<TPersist> {
    if (!Is.object(input)) return false;
    return 'defaults' in input || 'persist' in input || 'persistKey' in input;
  },
} as const;

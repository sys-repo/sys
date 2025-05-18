import { useEffect, useRef, useState } from 'react';
import { DevBus } from '../u/m.Bus/mod.ts';
import { DEFAULTS, Time, rx, slug, type t } from './common.ts';

type Id = string;

/**
 * Hook: Setup and lifecycle of the event-bus controller.
 */
export function useBusController(
  args: {
    bus?: t.EventBus;
    id?: Id;
    bundle?: t.SpecImport | t.SpecImporter | t.TestSuiteModel;
    env?: t.DevEnvVars;
    runOnLoad?: boolean;
  } = {},
) {
  const id = args.id ?? useRef(`dev.instance.${slug()}`).current;
  const bus = args.bus ?? useRef(rx.bus()).current;
  const instance = { bus, id };
  const busid = rx.bus.instance(bus);

  const [info, setInfo] = useState<t.DevInfo>(DEFAULTS.info);
  const eventsRef = useRef<t.DevEvents>();

  /**
   * Lifecycle
   */
  useEffect(() => {
    const env = args.env;
    const events = (eventsRef.current = DevBus.Controller({ instance, env }));
    events.info.changed$.pipe(rx.filter((e) => !!e.info)).subscribe((e) => setInfo(e.info));

    /**
     * Initialize.
     */
    const time = Time.until(events.dispose$);
    time.delay(0, async () => {
      const bundle = typeof args.bundle === 'function' ? args.bundle() : args.bundle;
      await events.load.fire(bundle);
      if (args.runOnLoad) events.run.fire();
    });

    return events.dispose;
  }, [id, busid, !!args.bundle, !!args.env]);

  /**
   * API
   */
  return {
    instance,
    info,
    get events() {
      return eventsRef.current;
    },
    get ready(): boolean {
      return !!info.render.props;
    },
  } as const;
}

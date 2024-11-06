import { CtxPropsDebug } from './Ctx.Props.Debug.ts';
import { CtxPropsHost } from './Ctx.Props.Host.ts';
import { CtxPropsSubject } from './Ctx.Props.Subject.ts';
import { DEFAULTS, rx, type t } from './common.ts';
import type { PropArgs } from './common.types.ts';

export async function CtxProps(events: t.DevEvents) {
  let _revision = 0;
  let _current = (await events.info.get()).render.props ?? DEFAULTS.props;

  const CHANGED: t.DevInfoChangeMessage[] = ['props:write', 'reset'];
  events.props.changed$.pipe(rx.filter((e) => CHANGED.includes(e.message))).subscribe((e) => {
    _current = e.info.render.props ?? DEFAULTS.props;
    _revision = 0;
  });

  const propArgs: PropArgs = {
    events,
    current: () => _current,
    changed: () => {
      _revision++;
      events.props.flush.pending(_revision);
    },
  };

  return {
    get current() {
      return _current;
    },
    get pending() {
      return _revision > 0;
    },
    setters: {
      subject: CtxPropsSubject(propArgs),
      host: CtxPropsHost(propArgs),
      debug: CtxPropsDebug(propArgs),
    },
  };
}

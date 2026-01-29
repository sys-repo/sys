import { describe, expect, it, type t } from '../../-test.ts';
import { EffectController } from '../mod.ts';
import { Rx } from '../common.ts';
import { defaultIsNoop } from '../u.noop.ts';

type State = { readonly k?: number };

function createPublishingRef(initial: State) {
  let state = initial;
  let _changeCalls = 0;
  const $ = Rx.subject<{ readonly after: State }>();
  const ref: t.EffectRef<State> = {
    get current() {
      return state;
    },
    change(mutator) {
      _changeCalls += 1;
      const draft = { ...state };
      mutator(draft);
      state = draft;
      $.next({ after: state });
    },
    events(dispose$: t.UntilInput) {
      const life = Rx.lifecycle(dispose$);
      life.dispose$.subscribe(() => $.complete());
      return { $ };
    },
  };

  return {
    ref,
    getCalls() {
      return _changeCalls;
    },
  };
}

describe('EffectController.noop guard', () => {
  it('skips controller.next when the predicate sees no change', () => {
    const { ref, getCalls } = createPublishingRef({} as State);
    const ctrl = EffectController.create<State>({ ref });
    const fired: State[] = [];

    ctrl.onChange((state) => fired.push(state));

    ctrl.next({} as Partial<State>);
    expect(getCalls()).to.eql(0);
    expect(ctrl.rev).to.eql(0);
    expect(fired).to.eql([]);

    ctrl.next();
    expect(getCalls()).to.eql(0);
    expect(ctrl.rev).to.eql(0);
    expect(fired).to.eql([]);

    ctrl.next({ k: 1 });
    expect(getCalls()).to.eql(1);
    expect(ctrl.rev).to.eql(1);
    expect(fired.length).to.eql(1);
    expect(fired[0].k).to.eql(1);

    ctrl.next({} as State);
    expect(getCalls()).to.eql(1);
    expect(ctrl.rev).to.eql(1);
    expect(fired.length).to.eql(1);

    ctrl.dispose();
  });

  it('suppresses redundant patches even when the ref publishes no-ops', () => {
    const { ref, getCalls } = createPublishingRef({} as State);
    const ctrl = EffectController.create<State>({ ref });
    const fired: State[] = [];

    ctrl.onChange((state) => fired.push(state));

    ctrl.next({ k: 1 });
    ctrl.next({ k: 1 });

    expect(getCalls()).to.eql(1);
    expect(ctrl.rev).to.eql(1);
    expect(fired.length).to.eql(1);
    expect(fired[0].k).to.eql(1);

    ctrl.dispose();
  });

  it('honors a custom isNoop even when the patch looks substantive', () => {
    const { ref, getCalls } = createPublishingRef({} as State);
    const ctrl = EffectController.create<State, State>({
      ref,
      isNoop: () => true,
    });

    ctrl.next({ k: 2 });
    expect(getCalls()).to.eql(0);
    expect(ctrl.rev).to.eql(0);

    ctrl.dispose();
  });

  it('treats class instance patches as meaningful even when values match', () => {
    class Patch {
      k = 1;
    }

    const result = defaultIsNoop({ k: 1 } as State, new Patch());
    expect(result).to.eql(false);
  });
});

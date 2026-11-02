import { afterAll, beforeAll, beforeEach, describe, DomMock, expect, it } from '../../../-test.ts';
import { D, Json, LocalStorage, Obj, Signal, type t } from '../common.ts';

type DebugModule = typeof import('../-spec/-SPEC.Debug.tsx');
type Stored = {
  theme: t.CommonTheme;
  debug: boolean;
  enabled: boolean;
  active: boolean;
  opacity?: number;
  view: 'single' | 'variants';
};
const storageKey = `dev:${D.displayName}`;
const defaults: Stored = {
  theme: 'Dark',
  debug: true,
  enabled: true,
  active: true,
  view: 'single',
};
const defaultSignals = { ...defaults, opacity: undefined };
const changed: Stored = {
  theme: 'Light',
  debug: false,
  enabled: false,
  active: false,
  opacity: 0,
  view: 'variants',
};
const persisted = () => Json.parse<Stored>(localStorage.getItem(storageKey) ?? undefined);

describe('Button spec: reset', () => {
  DomMock.init({ beforeAll, afterAll });
  let debugModule: DebugModule;
  beforeAll(async () => {
    debugModule = await import('../-spec/-SPEC.Debug.tsx');
  });
  beforeEach(() => LocalStorage.immutable<Stored>(storageKey, defaults).reset(defaults));

  it('persists current serializable values, including false and zero, before reset', () => {
    const debug = debugModule.createDebugSignals();
    const p = debug.props;
    p.theme.value = changed.theme;
    p.debug.value = changed.debug;
    p.enabled.value = changed.enabled;
    p.active.value = changed.active;
    p.opacity.value = changed.opacity;
    p.view.value = changed.view;

    expect(persisted()).to.eql(changed);
    expect(Signal.toObject(debugModule.createDebugSignals().props)).to.eql(changed);
  });

  it('resets every value without replacing signals and is safe to repeat', () => {
    LocalStorage.immutable<Stored>(storageKey, defaults).reset(changed);
    const debug = debugModule.createDebugSignals();
    const refs = { ...debug.props };
    expect(Signal.toObject(debug.props)).to.eql(changed);

    for (let i = 0; i < 2; i++) {
      debug.reset();
      expect(Signal.toObject(debug.props)).to.eql(defaultSignals);
      expect(persisted()).to.eql(defaults);
      for (const name of Obj.keys(refs)) expect(debug.props[name]).to.equal(refs[name]);
    }
    expect(Signal.toObject(debugModule.createDebugSignals().props)).to.eql(defaultSignals);
  });

  it('keeps callback modes transient, persists safe defaults, and clears them on reset', () => {
    const debug = debugModule.createDebugSignals();
    const p = debug.props;
    p.enabled.value = false;
    p.opacity.value = 0.1;
    const enabled = () => false;
    const opacity: t.Button.Prop.Callback<t.Percent> = (e) => e.is.over ? 0.8 : 0.3;
    p.enabled.value = enabled;
    p.opacity.value = opacity;
    expect(p.enabled.value).to.equal(enabled);
    expect(p.opacity.value).to.equal(opacity);
    expect(persisted()).to.eql(defaults);
    expect(Signal.toObject(debugModule.createDebugSignals().props)).to.eql(defaultSignals);

    debug.reset();
    expect(Signal.toObject(p)).to.eql(defaultSignals);
    expect(persisted()).to.eql(defaults);
  });
});

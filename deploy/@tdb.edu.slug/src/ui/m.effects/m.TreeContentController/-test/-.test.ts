import { describe, expect, it } from '../../../../-test.ts';
import { TreeContentController } from '../mod.ts';
import { type t, Immutable, Obj } from '../common.ts';
import { bindRefPath } from '../../mod.ts';
import { req } from './u.fixture.ts';

type TestRoot = {
  sheet: { content?: TestState };
  untouched: number;
};

type TestState = {
  phase: 'idle' | 'loading' | 'ready' | 'error';
  key?: string;
};

describe('TreeContentController', () => {
  describe('lifecycle transitions', () => {
    it('creates controller with intent/view methods', () => {
      const ctrl = TreeContentController.create();
      expect(ctrl.id).to.include('tree-content-');
      expect(typeof ctrl.intent).to.eql('function');
      expect(typeof ctrl.view).to.eql('function');
      expect(ctrl.current().phase).to.eql('idle');
      ctrl.dispose();
    });

    it('selection.changed resets lifecycle to idle and clears payload', () => {
      const ctrl = TreeContentController.create();
      ctrl.intent({ type: 'load.start', request: req('r1', 'key-a') });
      ctrl.intent({
        type: 'load.succeed',
        request: req('r1', 'key-a'),
        data: { title: 'A' },
      });
      ctrl.intent({ type: 'selection.changed', key: 'key-b' });

      const state = ctrl.current();
      expect(state.phase).to.eql('idle');
      expect(state.key).to.eql('key-b');
      expect(state.request).to.eql(undefined);
      expect(state.data).to.eql(undefined);
      expect(state.error).to.eql(undefined);
      ctrl.dispose();
    });

    it('initial seeds local store when ref is not provided', () => {
      const ctrl = TreeContentController.create({
        initial: { phase: 'ready', key: 'key-a', data: { title: 'A' } },
      });
      const state = ctrl.current();
      expect(state.phase).to.eql('ready');
      expect(state.key).to.eql('key-a');
      expect(state.data).to.eql({ title: 'A' });
      ctrl.dispose();
    });

    it('throws when ref is provided without initial seed', () => {
      const ref = Immutable.clonerRef<t.TreeContentController.State>({ phase: 'idle' });
      expect(() => TreeContentController.create({ ref } as never)).to.throw(
        'TreeContentController.create: initial is required when ref is provided.',
      );
    });

    it('reset restores the creation seed from initial object input', () => {
      const ctrl = TreeContentController.create({
        initial: { phase: 'ready', key: 'seed-key', data: { title: 'seed' } },
      });
      ctrl.intent({ type: 'load.start', request: req('r1', 'live-key') });
      ctrl.intent({ type: 'reset' });

      const state = ctrl.current();
      expect(state.phase).to.eql('ready');
      expect(state.key).to.eql('seed-key');
      expect(state.request).to.eql(undefined);
      expect(state.data).to.eql({ title: 'seed' });
      expect(state.error).to.eql(undefined);
      ctrl.dispose();
    });

    it('reset restores the creation seed from initial factory input', () => {
      const ctrl = TreeContentController.create({
        initial: () => ({ phase: 'ready', key: 'factory-key', data: { title: 'factory' } }),
      });
      ctrl.intent({ type: 'load.start', request: req('r1', 'live-key') });
      ctrl.intent({ type: 'reset' });

      const state = ctrl.current();
      expect(state.phase).to.eql('ready');
      expect(state.key).to.eql('factory-key');
      expect(state.request).to.eql(undefined);
      expect(state.data).to.eql({ title: 'factory' });
      expect(state.error).to.eql(undefined);
      ctrl.dispose();
    });
  });

  describe('request token gating (stale/race safety)', () => {
    it('accepts succeed only for active request token', () => {
      const ctrl = TreeContentController.create();
      ctrl.intent({ type: 'load.start', request: req('r1', 'key-a') });
      ctrl.intent({ type: 'load.start', request: req('r2', 'key-b') });

      ctrl.intent({
        type: 'load.succeed',
        request: req('r1', 'key-a'),
        data: { title: 'stale' },
      });
      let state = ctrl.current();
      expect(state.phase).to.eql('loading');
      expect(state.request?.id).to.eql('r2');
      expect(state.data).to.eql(undefined);

      ctrl.intent({
        type: 'load.succeed',
        request: req('r2', 'key-b'),
        data: { title: 'fresh' },
      });
      state = ctrl.current();
      expect(state.phase).to.eql('ready');
      expect(state.key).to.eql('key-b');
      expect(state.request).to.eql(undefined);
      expect(state.data).to.eql({ title: 'fresh' });
      ctrl.dispose();
    });

    it('accepts fail only for active request token', () => {
      const ctrl = TreeContentController.create();
      ctrl.intent({ type: 'load.start', request: req('r1', 'key-a') });
      ctrl.intent({ type: 'load.start', request: req('r2', 'key-b') });
      ctrl.intent({
        type: 'load.fail',
        request: req('r1', 'key-a'),
        message: 'stale',
      });

      let state = ctrl.current();
      expect(state.phase).to.eql('loading');
      expect(state.request?.id).to.eql('r2');
      expect(state.error).to.eql(undefined);

      ctrl.intent({
        type: 'load.fail',
        request: req('r2', 'key-b'),
        message: 'network',
      });
      state = ctrl.current();
      expect(state.phase).to.eql('error');
      expect(state.key).to.eql('key-b');
      expect(state.request).to.eql(undefined);
      expect(state.error).to.eql({ message: 'network' });
      ctrl.dispose();
    });

    it('load.cancel only cancels active request', () => {
      const ctrl = TreeContentController.create();
      ctrl.intent({ type: 'load.start', request: req('r1', 'key-a') });
      ctrl.intent({ type: 'load.cancel', requestId: 'r0' });
      let state = ctrl.current();
      expect(state.phase).to.eql('loading');
      expect(state.request?.id).to.eql('r1');
      expect(state.key).to.eql('key-a');

      ctrl.intent({ type: 'load.cancel', requestId: 'r1' });
      state = ctrl.current();
      expect(state.phase).to.eql('idle');
      expect(state.request).to.eql(undefined);
      expect(state.key).to.eql('key-a');
      ctrl.dispose();
    });
  });

  describe('view projection', () => {
    it('view projects loading phase and payload fields', () => {
      const ctrl = TreeContentController.create();
      ctrl.intent({ type: 'load.start', request: req('r1', 'key-a') });
      let view = ctrl.view();
      expect(view.phase).to.eql('loading');
      expect(view.loading).to.eql(true);
      expect(view.key).to.eql('key-a');

      ctrl.intent({
        type: 'load.succeed',
        request: req('r1', 'key-a'),
        data: { title: 'A' },
      });
      view = ctrl.view();
      expect(view.phase).to.eql('ready');
      expect(view.loading).to.eql(false);
      expect(view.data).to.eql({ title: 'A' });
      ctrl.dispose();
    });
  });

  describe('store injection policy', () => {
    type TSheet = t.TreeContentController.State;
    type TStore = { list: TSheet[]; map: { [key: string]: TSheet }; untouched: number };

    it('binds current/view to an injected immutable ref', () => {
      const ref = Immutable.clonerRef<t.TreeContentController.State>({
        phase: 'ready',
        key: 'key-a',
        data: { title: 'A' },
      });
      const ctrl = TreeContentController.create({
        ref,
        initial: { phase: 'ready', key: 'seed-key', data: { title: 'seed' } },
      });
      expect(ctrl.current().phase).to.eql('ready');
      expect(ctrl.current().data).to.eql({ title: 'A' });
      expect(ctrl.view().phase).to.eql('ready');

      ref.change((d) => {
        Object.assign(d, {
          phase: 'loading',
          request: req('r1', 'key-b'),
          key: 'key-b',
          data: undefined,
        });
      });
      expect(ctrl.current().phase).to.eql('loading');
      expect(ctrl.current().key).to.eql('key-b');
      expect(ctrl.view().loading).to.eql(true);
      ctrl.dispose();
    });

    it('intent writes are applied through the injected ref', () => {
      const ref = Immutable.clonerRef<t.TreeContentController.State>({ phase: 'idle' });
      const ctrl = TreeContentController.create({ ref, initial: { phase: 'idle' } });
      ctrl.intent({ type: 'load.start', request: req('r1', 'key-a') });
      expect(ref.current.phase).to.eql('loading');
      expect(ref.current.request).to.eql(req('r1', 'key-a'));
      ctrl.dispose();
    });

    it('reset uses explicit seed when ref is injected', () => {
      const ref = Immutable.clonerRef<t.TreeContentController.State>({
        phase: 'ready',
        key: 'external-key',
        data: { title: 'external' },
      });
      const ctrl = TreeContentController.create({
        ref,
        initial: { phase: 'ready', key: 'seed-key', data: { title: 'seed' } },
      });
      ctrl.intent({ type: 'load.start', request: req('r1', 'live-key') });
      ctrl.intent({ type: 'reset' });
      expect(ref.current).to.eql({
        phase: 'ready',
        key: 'seed-key',
        request: undefined,
        data: { title: 'seed' },
        error: undefined,
      });
      ctrl.dispose();
    });

    it('accepts path-bound EffectRef over a root store', () => {
      const root = Immutable.clonerRef<TestRoot>({
        sheet: { content: { phase: 'idle' } },
        untouched: 0,
      });
      const ref = bindRefPath<TestRoot, t.TreeContentController.State>({
        root,
        path: ['sheet', 'content'],
      });
      const ctrl = TreeContentController.create({ ref, initial: { phase: 'idle' } });

      ctrl.intent({ type: 'load.start', request: req('r1', 'key-a') });
      const leaf = Obj.Path.get<t.TreeContentController.State>(root.current, ['sheet', 'content']);
      expect(leaf).to.eql({
        phase: 'loading',
        key: 'key-a',
        request: req('r1', 'key-a'),
        data: undefined,
        error: undefined,
      });
      expect(root.current.untouched).to.eql(0);
      ctrl.dispose();
    });

    it('isolates two controllers bound to list and map leaves in one store', () => {
      const root = Immutable.clonerRef<TStore>({
        list: [{ phase: 'idle' }, { phase: 'idle' }],
        map: { primary: { phase: 'idle' } },
        untouched: 0,
      });
      const listRef = bindRefPath<TStore, t.TreeContentController.State>({
        root,
        path: ['list', 0],
      });
      const mapRef = bindRefPath<TStore, t.TreeContentController.State>({
        root,
        path: ['map', 'primary'],
      });
      const listCtrl = TreeContentController.create({ ref: listRef, initial: { phase: 'idle' } });
      const mapCtrl = TreeContentController.create({ ref: mapRef, initial: { phase: 'idle' } });

      listCtrl.intent({ type: 'load.start', request: req('l1', 'list-key') });
      mapCtrl.intent({ type: 'load.start', request: req('m1', 'map-key') });
      mapCtrl.intent({
        type: 'load.succeed',
        request: req('m1', 'map-key'),
        data: { title: 'ready' },
      });

      expect(root.current.list[0]).to.eql({
        phase: 'loading',
        key: 'list-key',
        request: req('l1', 'list-key'),
        data: undefined,
        error: undefined,
      });
      expect(root.current.map.primary).to.eql({
        phase: 'ready',
        key: 'map-key',
        request: undefined,
        data: { title: 'ready' },
        error: undefined,
      });
      expect(root.current.list[1]).to.eql({ phase: 'idle' });
      expect(root.current.untouched).to.eql(0);

      listCtrl.dispose();
      mapCtrl.dispose();
    });
  });
});

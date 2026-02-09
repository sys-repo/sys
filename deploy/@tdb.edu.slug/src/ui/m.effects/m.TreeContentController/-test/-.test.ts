import { describe, expect, it } from '../../../../-test.ts';
import { TreeContentController } from '../mod.ts';
import { req } from './u.fixture.ts';

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

      ctrl.intent({ type: 'load.cancel', requestId: 'r1' });
      state = ctrl.current();
      expect(state.phase).to.eql('idle');
      expect(state.request).to.eql(undefined);
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
});

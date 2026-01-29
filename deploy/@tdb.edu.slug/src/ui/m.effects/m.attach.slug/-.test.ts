import { describe, expect, it } from '../../../-test.ts';
import { type t, Schedule } from '../common.ts';
import { attachSlugLoaderEffect } from './mod.ts';
import {
  createTestController,
  makeTestPlaybackBundle,
} from '../../ui.SlugPlaybackDriver/-test/u.fixture.ts';

describe('controller: attachSlugLoaderEffect', () => {
  const tree: t.TreeHostViewNodeList = [
    {
      path: ['root'],
      key: 'root',
      label: 'root',
      children: [
        {
          path: ['root', 'ref-a'],
          key: 'ref-a',
          label: 'ref-a',
          value: { slug: 'Ref A', ref: 'slug:ref-a' },
        },
        {
          path: ['root', 'ref-b'],
          key: 'ref-b',
          label: 'ref-b',
          value: { slug: 'Ref B', ref: 'slug:ref-b' },
        },
        {
          path: ['root', 'inline'],
          key: 'inline',
          label: 'inline',
          value: { slug: 'Inline Only' },
        },
      ],
    },
  ];

  it('only loads once per ref selection even if state keeps changing', async () => {
    const ctrl = createTestController();
    const calls: string[] = [];

    const loadBundle = async (_baseUrl: t.StringUrl, ref: string) => {
      calls.push(ref);
      return { ok: true, value: makeTestPlaybackBundle(ref) } as const;
    };

    attachSlugLoaderEffect(ctrl, { loadBundle });

    const pathA: t.ObjectPath = ['root', 'ref-a'];
    ctrl.next({ slug: { ...(ctrl.current().slug ?? {}), tree, selectedPath: pathA } });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a']);

    // mutate controller state (should not trigger a reload for same ref)
    ctrl.next({ playback: { bundle: makeTestPlaybackBundle('dummy') } });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a']);

    const pathInline: t.ObjectPath = ['root', 'inline'];
    ctrl.next({ slug: { tree, selectedPath: pathInline } });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a']);

    const pathB: t.ObjectPath = ['root', 'ref-b'];
    ctrl.next({ slug: { tree, selectedPath: pathB } });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a', 'slug:ref-b']);

    ctrl.next({ slug: { ...(ctrl.current().slug ?? {}), tree, selectedPath: pathA } });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a', 'slug:ref-b', 'slug:ref-a']);

    ctrl.dispose();
  });

  it('does not re-request the same ref on 404 failure (prevents request loop)', async () => {
    const ctrl = createTestController();
    const calls: string[] = [];

    const loadBundle = async (_baseUrl: t.StringUrl, ref: string) => {
      calls.push(ref);
      return {
        ok: false,
        error: {
          kind: 'http',
          status: 404,
          statusText: 'Not Found',
          url: `http://example.invalid/${ref}`,
          message: '404',
        },
      } as const satisfies t.SlugClientResult<t.TimecodePlaybackDriver.Wire.Bundle>;
    };

    attachSlugLoaderEffect(ctrl, { loadBundle });

    const pathA: t.ObjectPath = ['root', 'ref-a'];
    ctrl.next({ slug: { ...(ctrl.current().slug ?? {}), tree, selectedPath: pathA } });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a']);

    // Churn state without changing selection/ref (this used to provoke loops).
    for (let i = 0; i < 20; i++) {
      ctrl.next({ playback: { bundle: makeTestPlaybackBundle(`churn-${i}`) } });
      await Schedule.micro();
    }

    // Must still be only one call for the same selection.
    expect(calls).to.eql(['slug:ref-a']);

    ctrl.dispose();
  });

  it('sets loading state and clears on success', async () => {
    const ctrl = createTestController();

    const loadBundle = async (_baseUrl: t.StringUrl, ref: string) => {
      return { ok: true, value: makeTestPlaybackBundle(ref) } as const;
    };

    attachSlugLoaderEffect(ctrl, { loadBundle });

    const pathA: t.ObjectPath = ['root', 'ref-a'];
    ctrl.next({ slug: { ...(ctrl.current().slug ?? {}), tree, selectedPath: pathA } });

    let state = ctrl.current();
    expect(state.slug?.loading?.isLoading).to.eql(true);
    expect(state.slug?.loading?.loadingRef).to.eql('slug:ref-a');
    expect(state.slug?.loading?.loadedRef).to.eql(undefined);
    expect(state.slug?.error).to.eql(undefined);
    expect(state.playback?.bundle).to.eql(undefined);

    await Schedule.micro();

    state = ctrl.current();
    expect(state.slug?.loading?.isLoading).to.eql(false);
    expect(state.slug?.loading?.loadingRef).to.eql(undefined);
    expect(state.slug?.loading?.loadedRef).to.eql('slug:ref-a');
    expect(state.slug?.error).to.eql(undefined);
    expect(state.playback?.bundle?.docid).to.eql('slug:ref-a');

    ctrl.dispose();
  });

  it('sets error on failure and does not retry same ref', async () => {
    const ctrl = createTestController();
    const calls: string[] = [];

    const loadBundle = async (_baseUrl: t.StringUrl, ref: string) => {
      calls.push(ref);
      return {
        ok: false,
        error: {
          kind: 'http',
          status: 500,
          statusText: 'Server Error',
          url: `http://example.invalid/${ref}`,
          message: 'boom',
        },
      } as const satisfies t.SlugClientResult<t.TimecodePlaybackDriver.Wire.Bundle>;
    };

    attachSlugLoaderEffect(ctrl, { loadBundle });

    const pathA: t.ObjectPath = ['root', 'ref-a'];
    ctrl.next({ slug: { tree, selectedPath: pathA } });

    let state = ctrl.current();
    expect(state.slug?.loading?.isLoading).to.eql(true);
    expect(state.slug?.loading?.loadingRef).to.eql('slug:ref-a');

    await Schedule.micro();

    state = ctrl.current();
    expect(state.slug?.loading?.isLoading).to.eql(false);
    expect(state.slug?.loading?.loadingRef).to.eql(undefined);
    expect(state.slug?.loading?.loadedRef).to.eql('slug:ref-a');
    expect(state.slug?.error?.message).to.eql('boom');
    expect(state.playback?.bundle).to.eql(undefined);

    ctrl.next({ slug: { ...(ctrl.current().slug ?? {}), tree, selectedPath: pathA } });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a']);

    ctrl.dispose();
  });

  it('clears loading state when selection is not refOnly', async () => {
    const ctrl = createTestController();

    const loadBundle = async (_baseUrl: t.StringUrl, ref: string) => {
      return { ok: true, value: makeTestPlaybackBundle(ref) } as const;
    };

    attachSlugLoaderEffect(ctrl, { loadBundle });

    const pathA: t.ObjectPath = ['root', 'ref-a'];
    ctrl.next({ slug: { tree, selectedPath: pathA } });
    await Schedule.micro();

    const pathInline: t.ObjectPath = ['root', 'inline'];
    ctrl.next({ slug: { tree, selectedPath: pathInline } });
    await Schedule.micro();

    const state = ctrl.current();
    expect(state.slug?.loading).to.eql(undefined);
    expect(state.slug?.error).to.eql(undefined);
    expect(state.playback?.bundle).to.eql(undefined);

    ctrl.dispose();
  });

  it('ignores stale load responses after selection change', async () => {
    const ctrl = createTestController();
    type LoadBundleResult = t.SlugClientResult<t.TimecodePlaybackDriver.Wire.Bundle>;

    let resolveA: ((value: LoadBundleResult) => void) | undefined;
    let resolveB: ((value: LoadBundleResult) => void) | undefined;

    const loadBundle = async (_baseUrl: t.StringUrl, ref: string) => {
      if (ref === 'slug:ref-a') {
        return await new Promise<LoadBundleResult>((resolve) => {
          resolveA = resolve;
        });
      }
      return await new Promise<LoadBundleResult>((resolve) => {
        resolveB = resolve;
      });
    };

    attachSlugLoaderEffect(ctrl, { loadBundle });

    const pathA: t.ObjectPath = ['root', 'ref-a'];
    const pathB: t.ObjectPath = ['root', 'ref-b'];
    ctrl.next({ slug: { tree, selectedPath: pathA } });
    ctrl.next({ slug: { tree, selectedPath: pathB } });

    resolveA?.({ ok: true, value: makeTestPlaybackBundle('slug:ref-a') });
    await Schedule.micro();
    expect(ctrl.current().playback?.bundle?.docid).to.not.eql('slug:ref-a');

    resolveB?.({ ok: true, value: makeTestPlaybackBundle('slug:ref-b') });
    await Schedule.micro();
    expect(ctrl.current().playback?.bundle?.docid).to.eql('slug:ref-b');

    ctrl.dispose();
  });
});

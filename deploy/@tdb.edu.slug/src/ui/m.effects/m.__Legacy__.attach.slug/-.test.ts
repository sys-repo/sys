import { describe, expect, it } from '../../../-test.ts';
import { type t, Effect, Immutable, Schedule } from '../common.ts';
import { attachSlugLoaderEffect } from './mod.ts';
import type { SlugEffectAdapter, SlugPlaybackSlugState } from './t.ts';

describe('controller: attachSlugLoaderEffect', () => {
  type State = { slug?: SlugPlaybackSlugState };
  type Fixture = {
    readonly adapter: SlugEffectAdapter;
    readonly controller: t.EffectController<State>;
    readonly getBundle: () => t.TimecodePlaybackDriver.Wire.Bundle | undefined;
    readonly setBundle: (bundle: t.TimecodePlaybackDriver.Wire.Bundle | undefined) => void;
  };

  const createFixture = (): Fixture => {
    const ref = Immutable.clonerRef<State>({});
    const controller = Effect.Controller.create({ ref });
    const adapter: SlugEffectAdapter = {
      disposed: controller.disposed,
      dispose$: controller.dispose$,
      current: () => controller.current().slug,
      onChange: (fn) => controller.onChange((state) => fn(state.slug)),
      next: (patch) =>
        controller.next({ slug: { ...(controller.current().slug ?? {}), ...patch } }),
    };
    let bundle: t.TimecodePlaybackDriver.Wire.Bundle | undefined;
    const setBundle = (next: t.TimecodePlaybackDriver.Wire.Bundle | undefined) => {
      bundle = next;
    };
    const getBundle = () => bundle;
    return { adapter, controller, getBundle, setBundle };
  };

  const makeTestPlaybackBundle = (docid: t.StringId): t.TimecodePlaybackDriver.Wire.Bundle => {
    const spec = {
      composition: undefined,
      beats: [],
    } as unknown as t.Timecode.Playback.Spec<unknown>;

    return {
      docid,
      spec,
      resolveAsset: () => undefined,
    };
  };

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
    const { adapter, controller, setBundle } = createFixture();
    const calls: string[] = [];

    const loadBundle = async (_baseUrl: t.StringUrl, ref: string) => {
      calls.push(ref);
      return { ok: true, value: makeTestPlaybackBundle(ref) } as const;
    };

    attachSlugLoaderEffect(adapter, { baseUrl: 'http://test', loadBundle, setBundle });

    const pathA: t.ObjectPath = ['root', 'ref-a'];
    controller.next({ slug: { ...(controller.current().slug ?? {}), tree, selectedPath: pathA } });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a']);

    // mutate controller state (should not trigger a reload for same ref)
    controller.next({ slug: { ...(controller.current().slug ?? {}), error: { message: 'noop' } } });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a']);

    const pathInline: t.ObjectPath = ['root', 'inline'];
    controller.next({
      slug: { ...(controller.current().slug ?? {}), tree, selectedPath: pathInline },
    });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a']);

    const pathB: t.ObjectPath = ['root', 'ref-b'];
    controller.next({ slug: { ...(controller.current().slug ?? {}), tree, selectedPath: pathB } });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a', 'slug:ref-b']);

    controller.next({ slug: { ...(controller.current().slug ?? {}), tree, selectedPath: pathA } });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a', 'slug:ref-b', 'slug:ref-a']);

    controller.dispose();
  });

  it('does not re-request the same ref on 404 failure (prevents request loop)', async () => {
    const { adapter, controller, setBundle } = createFixture();
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

    attachSlugLoaderEffect(adapter, { baseUrl: 'http://test', loadBundle, setBundle });

    const pathA: t.ObjectPath = ['root', 'ref-a'];
    controller.next({ slug: { ...(controller.current().slug ?? {}), tree, selectedPath: pathA } });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a']);

    // Churn state without changing selection/ref (this used to provoke loops).
    for (let i = 0; i < 20; i++) {
      controller.next({
        slug: { ...(controller.current().slug ?? {}), error: { message: `churn-${i}` } },
      });
      await Schedule.micro();
    }

    // Must still be only one call for the same selection.
    expect(calls).to.eql(['slug:ref-a']);

    controller.dispose();
  });

  it('sets loading state and clears on success', async () => {
    const { adapter, controller, getBundle, setBundle } = createFixture();

    const loadBundle = async (_baseUrl: t.StringUrl, ref: string) => {
      return { ok: true, value: makeTestPlaybackBundle(ref) } as const;
    };

    attachSlugLoaderEffect(adapter, { baseUrl: 'http://test', loadBundle, setBundle });

    const pathA: t.ObjectPath = ['root', 'ref-a'];
    controller.next({ slug: { ...(controller.current().slug ?? {}), tree, selectedPath: pathA } });

    let state = controller.current();
    expect(state.slug?.loading?.isLoading).to.eql(true);
    expect(state.slug?.loading?.loadingRef).to.eql('slug:ref-a');
    expect(state.slug?.loading?.loadedRef).to.eql(undefined);
    expect(state.slug?.error).to.eql(undefined);
    expect(getBundle()).to.eql(undefined);

    await Schedule.micro();

    state = controller.current();
    expect(state.slug?.loading?.isLoading).to.eql(false);
    expect(state.slug?.loading?.loadingRef).to.eql(undefined);
    expect(state.slug?.loading?.loadedRef).to.eql('slug:ref-a');
    expect(state.slug?.error).to.eql(undefined);
    expect(getBundle()?.docid).to.eql('slug:ref-a');

    controller.dispose();
  });

  it('sets error on failure and does not retry same ref', async () => {
    const { adapter, controller, getBundle, setBundle } = createFixture();
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

    attachSlugLoaderEffect(adapter, { baseUrl: 'http://test', loadBundle, setBundle });

    const pathA: t.ObjectPath = ['root', 'ref-a'];
    controller.next({ slug: { ...(controller.current().slug ?? {}), tree, selectedPath: pathA } });

    let state = controller.current();
    expect(state.slug?.loading?.isLoading).to.eql(true);
    expect(state.slug?.loading?.loadingRef).to.eql('slug:ref-a');

    await Schedule.micro();

    state = controller.current();
    expect(state.slug?.loading?.isLoading).to.eql(false);
    expect(state.slug?.loading?.loadingRef).to.eql(undefined);
    expect(state.slug?.loading?.loadedRef).to.eql('slug:ref-a');
    expect(state.slug?.error?.message).to.eql('boom');
    expect(getBundle()).to.eql(undefined);

    controller.next({ slug: { ...(controller.current().slug ?? {}), tree, selectedPath: pathA } });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a']);

    controller.dispose();
  });

  it('clears loading state when selection is not refOnly', async () => {
    const { adapter, controller, getBundle, setBundle } = createFixture();

    const loadBundle = async (_baseUrl: t.StringUrl, ref: string) => {
      return { ok: true, value: makeTestPlaybackBundle(ref) } as const;
    };

    attachSlugLoaderEffect(adapter, { baseUrl: 'http://test', loadBundle, setBundle });

    const pathA: t.ObjectPath = ['root', 'ref-a'];
    controller.next({ slug: { ...(controller.current().slug ?? {}), tree, selectedPath: pathA } });
    await Schedule.micro();

    const pathInline: t.ObjectPath = ['root', 'inline'];
    controller.next({
      slug: { ...(controller.current().slug ?? {}), tree, selectedPath: pathInline },
    });
    await Schedule.micro();

    const state = controller.current();
    expect(state.slug?.loading).to.eql(undefined);
    expect(state.slug?.error).to.eql(undefined);
    expect(getBundle()).to.eql(undefined);

    controller.dispose();
  });

  it('ignores stale load responses after selection change', async () => {
    const { adapter, controller, getBundle, setBundle } = createFixture();
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

    attachSlugLoaderEffect(adapter, { baseUrl: 'http://test', loadBundle, setBundle });

    const pathA: t.ObjectPath = ['root', 'ref-a'];
    const pathB: t.ObjectPath = ['root', 'ref-b'];
    controller.next({ slug: { ...(controller.current().slug ?? {}), tree, selectedPath: pathA } });
    controller.next({ slug: { ...(controller.current().slug ?? {}), tree, selectedPath: pathB } });

    resolveA?.({ ok: true, value: makeTestPlaybackBundle('slug:ref-a') });
    await Schedule.micro();
    expect(getBundle()?.docid).to.not.eql('slug:ref-a');

    resolveB?.({ ok: true, value: makeTestPlaybackBundle('slug:ref-b') });
    await Schedule.micro();
    expect(getBundle()?.docid).to.eql('slug:ref-b');

    controller.dispose();
  });
});

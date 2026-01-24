import { describe, expect, it } from '../../../-test.ts';
import { type t, Schedule } from '../common.ts';
import { attachSlugLoaderEffect } from '../u.attachSlugLoaderEffect.ts';
import { createTestController, makeTestPlaybackBundle } from './u.fixture.ts';

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
    ctrl.next({ tree, selectedPath: pathA });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a']);

    // mutate controller state (should not trigger a reload for same ref)
    ctrl.next({ bundle: makeTestPlaybackBundle('dummy') });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a']);

    const pathInline: t.ObjectPath = ['root', 'inline'];
    ctrl.next({ selectedPath: pathInline });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a']);

    const pathB: t.ObjectPath = ['root', 'ref-b'];
    ctrl.next({ selectedPath: pathB });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a', 'slug:ref-b']);

    ctrl.next({ selectedPath: pathA });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a', 'slug:ref-b', 'slug:ref-a']);

    ctrl.dispose();
  });
});

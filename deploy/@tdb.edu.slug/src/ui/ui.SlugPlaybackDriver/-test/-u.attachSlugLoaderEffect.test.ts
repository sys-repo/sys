import { describe, expect, it } from '../../../-test.ts';
import { type t, EffectController, Immutable, Schedule, slug } from '../common.ts';
import { attachSlugLoaderEffect } from '../u.attachSlugLoaderEffect.ts';

type State = t.SlugPlaybackState;
type Patch = t.SlugPlaybackPatch;
type Props = t.SlugPlaybackControllerProps;

describe('attachSlugLoaderEffect', () => {
  const baseUrl: t.StringUrl = 'http://test';

  const createController = () => {
    const id = `slug-playback-${slug()}`;
    const ref = Immutable.clonerRef<State>({});
    const props: Props = { baseUrl };
    return EffectController.create<State, Patch, Props>({ id, ref, props });
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
    const ctrl = createController();
    const calls: string[] = [];
    const loadBundle = async (_baseUrl: t.StringUrl, ref: string) => {
      calls.push(ref);
      return { slug: `loaded-${ref}` };
    };

    attachSlugLoaderEffect(ctrl, { baseUrl, loadBundle });

    const pathA: t.ObjectPath = ['root', 'ref-a'];
    ctrl.next({ tree, selectedPath: pathA });
    await Schedule.micro();
    expect(calls).to.eql(['slug:ref-a']);

    ctrl.next({ slug: { slug: 'dummy' } });
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

import { type t, EffectController, Immutable, slug } from '../common.ts';

type State = t.SlugKbState;
type Patch = t.SlugKbPatch;
type Props = t.SlugKbControllerProps;

/**
 * SlugKbController factory.
 */
export const Controller: t.SlugKbControllerLib = {
  create(props) {
    const id = `slug-kb-${slug()}`;
    const ref = Immutable.clonerRef<State>({});
    const controller = EffectController.create<State, Patch, Props>({ id, ref, props });

    return controller;
  },
};

import { type t, Signal, rx } from './common.ts';

export const background: t.AppControllersLib['background'] = (state, until$) => {
  const listeners = Signal.listeners(until$);

  /**
   * Blur background when higher layers are visible.
   */
  listeners.effect(() => {
    const totalLayers = state.stack.length;
    const blur = state.props.background.video.blur;
    blur.value = totalLayers > 1 ? 20 : 0;
  });

  /**
   * API
   */
  return rx.toLifecycle<t.AppController>(listeners, {
    kind: 'Controller:App:Background',
    children: [],
  });
};

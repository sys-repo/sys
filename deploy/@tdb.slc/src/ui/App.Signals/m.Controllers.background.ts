import { type t, Signal, rx } from './common.ts';

export const background: t.AppControllersLib['background'] = (state, until$) => {
  const listeners = Signal.listeners(until$);

  /**
   * Blur background when higher layers are visible.
   */
  listeners.effect(() => {
    const layers = state.stack.length;
    state.props.background.video.blur.value = layers > 1 ? 20 : 0;
  });

  /**
   * API
   */
  return rx.toLifecycle<t.AppController>(listeners, {
    id: 'Controller:App:Background',
    children: [],
  });
};

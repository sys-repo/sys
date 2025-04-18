import { type t, Signal, rx } from './common.ts';

export const background: t.AppControllersLib['background'] = (state, until$) => {
  const kind: t.AppControllerKind = 'Controller:App:Background';
  const listeners = Signal.listeners(until$);
  const controllers = state.props.controllers;
  controllers.listening.value = [...controllers.listening.value, kind];

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
    kind,
    children: [],
  });
};

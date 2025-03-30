import type { t } from './common.ts';
import { find } from './m.Content.find.tsx';
import { render } from './m.Content.render.tsx';

export const AppContent = {
  find,
  render,

  /**
   * Find the video-player controller for the given layer
   */
  Player: {
    find(app: t.AppSignals, layer: t.StringId | t.Content, index: number) {
      const layerId = wrangle.layerId(layer);
      const key = `${layerId}.${index}`;
      return app.props.players[key];
    },
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  layerId(input: t.StringId | t.Content): t.StringId {
    return typeof input === 'string' ? input : input.id;
  },
} as const;

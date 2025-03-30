import type { t } from './common.ts';

export const AppPlayer: t.AppSignalsPlayer = {
  find(app: t.AppSignals, layer: t.StringId | t.Content, index: number) {
    const key = AppPlayer.key(layer, index);
    return app.props.players[key];
  },

  key(layer, index) {
    const layerId = wrangle.layerId(layer);
    return `${layerId}:[${index}]`;
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

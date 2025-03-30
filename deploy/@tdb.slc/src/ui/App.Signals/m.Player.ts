import type { t } from './common.ts';

export const Player: t.AppSignalsPlayer = {
  find(app: t.AppSignals, layer: t.StringId | t.Content, index: number) {
    const layerId = wrangle.layerId(layer);
    const key = `${layerId}.${index}`;
    return app.props.players[key];
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

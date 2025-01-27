import type { t } from './common.ts';
export type * from './t.Time.ts';

export type YamlFences = ConceptPlayerDef;

export type YamlFenceBase = {
  debug?: boolean;
};

/**
 * A YAML block that defines a concept player.
 */
export type ConceptPlayerDef = YamlFenceBase & {
  component: 'ConceptPlayer';
  video?: StringVideoUri;
  timestamps?: t.Timestamps;
};

export type StringVideoUri = StringVimeoUri;
export type StringVimeoUri = t.StringUri; // "vimeo/<id>"
